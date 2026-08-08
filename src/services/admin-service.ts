import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import db from "@/db";
import {
  accounts,
  adminAuditLog,
  friendRequests,
  friendships,
  gameScoreEntries,
  loginEvents,
  scoreComments,
  scoreReactions,
  sessions,
  users,
} from "@/db/schema";
import type { AdminAction } from "@/db/schema";
import { badRequest } from "@/lib/api";

/**
 * A timestamp usable inside a raw `sql` template.
 *
 * Interpolating a bare `Date` does not work here: in a raw template there is no
 * column for drizzle to infer an encoder from, so postgres.js is handed a Date
 * where it expects a string and throws. An explicit ISO literal with a cast
 * sidesteps that. `toISOString()` is UTC, and these columns store UTC, so the
 * comparison is exact.
 *
 * Comparisons built with drizzle helpers (`gte(table.col, date)`) are fine and
 * do not need this - they know the column type.
 */
function timestamp(date: Date) {
  return sql`${date.toISOString()}::timestamp`;
}

function daysAgo(days: number) {
  return timestamp(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return timestamp(date);
}

/**
 * Read models for the admin area, plus the audit writes.
 *
 * Counts use correlated subqueries rather than joins so one row per user comes
 * back regardless of how many scores or friends they have. Fine at this table
 * size; revisit if the user list ever needs pagination.
 */
export class AdminService {
  static async getOverview() {
    const [row] = await db
      .select({
        totalUsers: sql<number>`(select count(*)::int from ${users})`,
        adminUsers: sql<number>`(select count(*)::int from ${users} where ${users.role} = 'admin')`,
        privateScoreUsers: sql<number>`(select count(*)::int from ${users} where ${users.isPrivate})`,
        privateActivityUsers: sql<number>`(select count(*)::int from ${users} where ${users.interactionsPrivate})`,
        newUsers7d: sql<number>`(select count(*)::int from ${users} where ${users.createdAt} >= ${daysAgo(7)})`,
        activeUsers7d: sql<number>`(select count(distinct ${loginEvents.userId})::int from ${loginEvents} where ${loginEvents.createdAt} >= ${daysAgo(7)})`,
        neverLoggedIn: sql<number>`(select count(*)::int from ${users} where ${users.lastLoginAt} is null)`,
        totalScores: sql<number>`(select count(*)::int from ${gameScoreEntries})`,
        scoresToday: sql<number>`(select count(*)::int from ${gameScoreEntries} where ${gameScoreEntries.createdAt} >= ${startOfToday()})`,
        scores7d: sql<number>`(select count(*)::int from ${gameScoreEntries} where ${gameScoreEntries.createdAt} >= ${daysAgo(7)})`,
        totalComments: sql<number>`(select count(*)::int from ${scoreComments})`,
        totalReactions: sql<number>`(select count(*)::int from ${scoreReactions})`,
        // Stored bidirectionally, so halve it to get real pairs.
        friendPairs: sql<number>`(select (count(*) / 2)::int from ${friendships})`,
        pendingRequests: sql<number>`(select count(*)::int from ${friendRequests} where ${friendRequests.status} = 'pending')`,
        activeSessions: sql<number>`(select count(*)::int from ${sessions} where ${sessions.expires} > now())`,
        logins7d: sql<number>`(select count(*)::int from ${loginEvents} where ${loginEvents.createdAt} >= ${daysAgo(7)})`,
      })
      .from(sql`(select 1) as _`);

    return row;
  }

  static async listUsers() {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        isPrivate: users.isPrivate,
        interactionsPrivate: users.interactionsPrivate,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        loginCount: users.loginCount,
        scoreCount: sql<number>`(select count(*)::int from ${gameScoreEntries} where ${gameScoreEntries.userId} = ${users.id})`,
        friendCount: sql<number>`(select count(*)::int from ${friendships} where ${friendships.userId} = ${users.id})`,
        commentCount: sql<number>`(select count(*)::int from ${scoreComments} where ${scoreComments.userId} = ${users.id})`,
        activeSessions: sql<number>`(select count(*)::int from ${sessions} where ${sessions.userId} = ${users.id} and ${sessions.expires} > now())`,
        lastScoreAt: sql<Date | null>`(select max(${gameScoreEntries.createdAt}) from ${gameScoreEntries} where ${gameScoreEntries.userId} = ${users.id})`,
      })
      .from(users)
      .orderBy(sql`${users.lastLoginAt} desc nulls last`);
  }

  static async getUserDetail(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    const [
      logins,
      activeSessions,
      linkedAccounts,
      friends,
      recentScores,
      recentComments,
      incomingRequests,
      outgoingRequests,
      [tallies],
    ] = await Promise.all([
      db.query.loginEvents.findMany({
        where: eq(loginEvents.userId, userId),
        orderBy: desc(loginEvents.createdAt),
        limit: 25,
      }),
      db
        .select({
          sessionToken: sessions.sessionToken,
          expires: sessions.expires,
        })
        .from(sessions)
        .where(
          and(eq(sessions.userId, userId), gte(sessions.expires, new Date()))
        )
        .orderBy(desc(sessions.expires)),
      db
        .select({
          provider: accounts.provider,
          type: accounts.type,
          providerAccountId: accounts.providerAccountId,
          expiresAt: accounts.expires_at,
        })
        .from(accounts)
        .where(eq(accounts.userId, userId)),
      db.query.friendships.findMany({
        where: eq(friendships.userId, userId),
        with: {
          friend: {
            columns: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: desc(friendships.createdAt),
      }),
      db.query.gameScoreEntries.findMany({
        where: eq(gameScoreEntries.userId, userId),
        orderBy: desc(gameScoreEntries.createdAt),
        limit: 20,
      }),
      db.query.scoreComments.findMany({
        where: eq(scoreComments.userId, userId),
        orderBy: desc(scoreComments.createdAt),
        limit: 20,
      }),
      db.query.friendRequests.findMany({
        where: and(
          eq(friendRequests.receiverId, userId),
          eq(friendRequests.status, "pending")
        ),
        with: { sender: { columns: { id: true, name: true, email: true } } },
      }),
      db.query.friendRequests.findMany({
        where: and(
          eq(friendRequests.senderId, userId),
          eq(friendRequests.status, "pending")
        ),
        with: { receiver: { columns: { id: true, name: true, email: true } } },
      }),
      db
        .select({
          scoreCount: sql<number>`(select count(*)::int from ${gameScoreEntries} where ${gameScoreEntries.userId} = ${userId})`,
          commentCount: sql<number>`(select count(*)::int from ${scoreComments} where ${scoreComments.userId} = ${userId})`,
          reactionCount: sql<number>`(select count(*)::int from ${scoreReactions} where ${scoreReactions.userId} = ${userId})`,
          friendCount: sql<number>`(select count(*)::int from ${friendships} where ${friendships.userId} = ${userId})`,
        })
        .from(sql`(select 1) as _`),
    ]);

    return {
      user,
      logins,
      activeSessions,
      linkedAccounts,
      friends: friends.map((row) => row.friend),
      recentScores,
      recentComments,
      incomingRequests,
      outgoingRequests,
      tallies,
    };
  }

  /**
   * Changes another user's privacy switches on their behalf.
   *
   * Turning a switch *off* widens who can see that person's scores or activity,
   * which they did not ask for, so every change is written to the audit log
   * with its before and after values. Nothing here is silent.
   *
   * Returns the updated flags, or null if the user does not exist.
   */
  static async setUserPrivacy(
    adminUserId: string,
    targetUserId: string,
    changes: { isPrivate?: boolean; interactionsPrivate?: boolean }
  ) {
    const update: Partial<typeof users.$inferInsert> = {};
    if (typeof changes.isPrivate === "boolean") {
      update.isPrivate = changes.isPrivate;
    }
    if (typeof changes.interactionsPrivate === "boolean") {
      update.interactionsPrivate = changes.interactionsPrivate;
    }

    if (Object.keys(update).length === 0) {
      throw badRequest("Nothing to update");
    }

    const before = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: {
        id: true,
        email: true,
        isPrivate: true,
        interactionsPrivate: true,
      },
    });

    if (!before) {
      return null;
    }

    const [after] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, targetUserId))
      .returning({
        isPrivate: users.isPrivate,
        interactionsPrivate: users.interactionsPrivate,
      });

    const described = (["isPrivate", "interactionsPrivate"] as const)
      .filter((key) => before[key] !== after[key])
      .map((key) => `${key}: ${before[key]} -> ${after[key]}`);

    // A no-op change is not worth an audit row.
    if (described.length > 0) {
      await this.recordAudit({
        adminUserId,
        action: "privacy.update",
        targetUserId,
        detail: `${before.email} ${described.join(", ")}`,
      });
    }

    return after;
  }

  static async getRecentLogins(limit = 20) {
    return await db.query.loginEvents.findMany({
      orderBy: desc(loginEvents.createdAt),
      limit,
      with: {
        user: { columns: { id: true, name: true, email: true, image: true } },
      },
    });
  }

  static async getAuditLog(limit = 50) {
    return await db.query.adminAuditLog.findMany({
      orderBy: desc(adminAuditLog.createdAt),
      limit,
      with: {
        adminUser: { columns: { id: true, name: true, email: true } },
        targetUser: { columns: { id: true, name: true, email: true } },
      },
    });
  }

  static async recordAudit(entry: {
    adminUserId: string;
    action: AdminAction;
    targetUserId?: string | null;
    detail?: string | null;
  }): Promise<void> {
    await db.insert(adminAuditLog).values({
      adminUserId: entry.adminUserId,
      action: entry.action,
      targetUserId: entry.targetUserId ?? null,
      detail: entry.detail ?? null,
    });
  }

  /** Per-game activity, used for the small breakdown on the overview page. */
  static async getGameBreakdown() {
    return await db
      .select({
        gameType: gameScoreEntries.gameType,
        total: count(gameScoreEntries.id),
        players: sql<number>`count(distinct ${gameScoreEntries.userId})::int`,
        lastPlayedAt: sql<Date>`max(${gameScoreEntries.createdAt})`,
      })
      .from(gameScoreEntries)
      .groupBy(gameScoreEntries.gameType)
      .orderBy(desc(count(gameScoreEntries.id)));
  }
}
