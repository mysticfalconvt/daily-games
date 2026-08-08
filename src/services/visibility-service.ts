import { and, eq, inArray, not, or } from "drizzle-orm";

import db from "@/db";
import { friendships, gameScoreEntries, users } from "@/db/schema";
import { forbidden, notFound } from "@/lib/api";

/**
 * The single source of truth for "who can see what".
 *
 * There are two independent switches on a user:
 *
 *   is_private            - who may see the scores they post
 *   interactions_private  - who may see their comments and reactions
 *
 * Both mean the same thing when set: friends only. They are separate because a
 * private user commenting on a public score would otherwise put their name in
 * front of strangers.
 *
 * Every read path must go through this service. The rules used to live inline
 * in one filter function, which is why the comment and reaction endpoints
 * silently had no privacy checks at all.
 *
 * Note on scale: these helpers materialise ID lists rather than composing a SQL
 * predicate. That is deliberate for an app with a small user table; if the user
 * count ever grows into the thousands this should become an EXISTS subquery.
 */
export class VisibilityService {
  /**
   * Friend IDs for a user. Friendships are stored bidirectionally, so a single
   * lookup on `userId` is complete.
   */
  static async getFriendIds(userId: string): Promise<string[]> {
    const rows = await db.query.friendships.findMany({
      where: eq(friendships.userId, userId),
      columns: { friendId: true },
    });
    return rows.map((row) => row.friendId);
  }

  static async areFriends(userId: string, otherId: string): Promise<boolean> {
    if (userId === otherId) {
      return true;
    }
    const row = await db.query.friendships.findFirst({
      where: and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, otherId)
      ),
      columns: { id: true },
    });
    return Boolean(row);
  }

  static async hasFriends(userId: string): Promise<boolean> {
    const row = await db.query.friendships.findFirst({
      where: eq(friendships.userId, userId),
      columns: { id: true },
    });
    return Boolean(row);
  }

  /**
   * Users whose *scores* the viewer may see: themselves, their friends, and
   * anyone who has not marked their scores private.
   *
   * `friendsOnly` narrows this to self + friends. It is a display preference,
   * not a security boundary - it can only ever subtract from the ceiling, so a
   * caller passing it from a query string cannot widen anything.
   */
  static async getVisibleScoreOwnerIds(
    viewerId: string,
    { friendsOnly = false }: { friendsOnly?: boolean } = {}
  ): Promise<string[]> {
    const friendIds = await this.getFriendIds(viewerId);

    if (friendsOnly) {
      return [viewerId, ...friendIds];
    }

    const visible = await db.query.users.findMany({
      where: or(
        not(users.isPrivate),
        eq(users.id, viewerId),
        inArray(users.id, friendIds)
      ),
      columns: { id: true },
    });

    return visible.map((user) => user.id);
  }

  /**
   * Users whose *comments and reactions* the viewer may see. Applied on top of
   * score visibility: being allowed to read a score does not entitle you to see
   * a private user's activity on it.
   */
  static async getVisibleInteractionAuthorIds(
    viewerId: string
  ): Promise<string[]> {
    const friendIds = await this.getFriendIds(viewerId);

    const visible = await db.query.users.findMany({
      where: or(
        not(users.interactionsPrivate),
        eq(users.id, viewerId),
        inArray(users.id, friendIds)
      ),
      columns: { id: true },
    });

    return visible.map((user) => user.id);
  }

  /** Whether the viewer may see scores posted by `ownerId`. */
  static async canViewScoresOf(
    viewerId: string,
    ownerId: string
  ): Promise<boolean> {
    if (viewerId === ownerId) {
      return true;
    }

    const owner = await db.query.users.findFirst({
      where: eq(users.id, ownerId),
      columns: { isPrivate: true },
    });

    if (!owner) {
      return false;
    }
    if (!owner.isPrivate) {
      return true;
    }
    return this.areFriends(viewerId, ownerId);
  }

  /**
   * Resolves a score and confirms the viewer may see it.
   *
   * Throws 404 rather than 403 for a score the viewer cannot see, so score IDs
   * cannot be probed for existence.
   */
  static async requireViewableScore(viewerId: string, scoreId: string) {
    const score = await db.query.gameScoreEntries.findFirst({
      where: eq(gameScoreEntries.id, scoreId),
      columns: { id: true, userId: true },
    });

    if (!score) {
      throw notFound("Score not found");
    }

    if (!(await this.canViewScoresOf(viewerId, score.userId))) {
      throw notFound("Score not found");
    }

    return score;
  }

  /**
   * Confirms the viewer may comment on / react to a score. Same rule as
   * reading it: if it is in your feed, you can respond to it.
   */
  static async requireInteractableScore(viewerId: string, scoreId: string) {
    const score = await db.query.gameScoreEntries.findFirst({
      where: eq(gameScoreEntries.id, scoreId),
      columns: { id: true, userId: true },
    });

    if (!score) {
      throw notFound("Score not found");
    }

    if (!(await this.canViewScoresOf(viewerId, score.userId))) {
      throw forbidden("You do not have permission to interact with this score");
    }

    return score;
  }
}
