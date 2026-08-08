import { and, eq, or } from "drizzle-orm";

import db from "@/db";
import {
  PUBLIC_USER_COLUMNS,
  friendRequests,
  friendships,
  users,
} from "@/db/schema";
import { badRequest, conflict, notFound } from "@/lib/api";

/** Emails are stored as the provider gave them; compare them case-folded. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class FriendService {
  static async sendFriendRequestByEmail(
    senderId: string,
    receiverEmailInput: string
  ): Promise<void> {
    const receiverEmail = normalizeEmail(receiverEmailInput);

    const receiver = await db.query.users.findFirst({
      // Case-insensitive: "Jane@Example.com" and "jane@example.com" are the
      // same person, and the previous exact match quietly failed on them.
      where: (fields, { sql }) =>
        sql`lower(${fields.email}) = ${receiverEmail}`,
      columns: { id: true },
    });

    if (!receiver) {
      throw notFound("User not found");
    }

    await this.sendFriendRequest(senderId, receiver.id);
  }

  /**
   * Sends a request to a known user id. Used by the search box, which resolves
   * a person without ever handing their email address to the browser.
   */
  static async sendFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<void> {
    if (receiverId === senderId) {
      throw badRequest("Cannot add yourself as a friend");
    }

    const receiver = await db.query.users.findFirst({
      where: eq(users.id, receiverId),
      columns: { id: true },
    });

    if (!receiver) {
      throw notFound("User not found");
    }

    const existingFriendship = await db.query.friendships.findFirst({
      where: and(
        eq(friendships.userId, senderId),
        eq(friendships.friendId, receiver.id)
      ),
      columns: { id: true },
    });

    if (existingFriendship) {
      throw conflict("Already friends with this user");
    }

    const pending = await db.query.friendRequests.findFirst({
      where: and(
        eq(friendRequests.status, "pending"),
        or(
          and(
            eq(friendRequests.senderId, senderId),
            eq(friendRequests.receiverId, receiver.id)
          ),
          // A request already coming the other way would otherwise produce two
          // crossed pending requests that each need accepting.
          and(
            eq(friendRequests.senderId, receiver.id),
            eq(friendRequests.receiverId, senderId)
          )
        )
      ),
      columns: { senderId: true },
    });

    if (pending) {
      throw conflict(
        pending.senderId === senderId
          ? "Friend request already sent"
          : "This user has already sent you a request - check your incoming requests"
      );
    }

    await db.insert(friendRequests).values({
      senderId,
      receiverId: receiver.id,
      status: "pending",
    });
  }

  static async acceptFriendRequest(
    requestId: string,
    userId: string
  ): Promise<void> {
    const request = await db.query.friendRequests.findFirst({
      where: and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, "pending")
      ),
    });

    if (!request) {
      throw notFound("Friend request not found or not authorized");
    }

    await db.transaction(async (tx) => {
      // Both directions, so friend lookups only ever query `userId`.
      // onConflictDoNothing makes a retried accept idempotent instead of
      // tripping the unique constraint.
      await tx
        .insert(friendships)
        .values([
          { userId: request.receiverId, friendId: request.senderId },
          { userId: request.senderId, friendId: request.receiverId },
        ])
        .onConflictDoNothing();

      await tx
        .update(friendRequests)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(friendRequests.id, requestId));
    });
  }

  static async declineFriendRequest(
    requestId: string,
    userId: string
  ): Promise<void> {
    const result = await db
      .update(friendRequests)
      .set({ status: "declined", updatedAt: new Date() })
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.receiverId, userId),
          eq(friendRequests.status, "pending")
        )
      )
      .returning({ id: friendRequests.id });

    if (result.length === 0) {
      throw notFound("Friend request not found or not authorized");
    }
  }

  static async cancelFriendRequest(
    requestId: string,
    userId: string
  ): Promise<void> {
    const result = await db
      .delete(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.senderId, userId),
          eq(friendRequests.status, "pending")
        )
      )
      .returning({ id: friendRequests.id });

    if (result.length === 0) {
      throw notFound("Friend request not found or not authorized");
    }
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(friendships)
        .where(
          and(
            eq(friendships.userId, userId),
            eq(friendships.friendId, friendId)
          )
        );

      await tx
        .delete(friendships)
        .where(
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId)
          )
        );
    });
  }

  static async getFriends(userId: string) {
    const rows = await db.query.friendships.findMany({
      where: eq(friendships.userId, userId),
      // Email is included for accepted friends only - it is how you added them,
      // and the list uses it to tell two people with the same name apart. The
      // leak that mattered was the *feed* carrying emails to strangers.
      with: {
        friend: { columns: { ...PUBLIC_USER_COLUMNS, email: true } },
      },
      orderBy: (fields, { desc }) => desc(fields.createdAt),
    });

    return rows.map((row) => row.friend);
  }

  static async getIncomingRequests(userId: string) {
    return await db.query.friendRequests.findMany({
      where: and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, "pending")
      ),
      // The sender's email is shown deliberately: you are deciding whether you
      // know this person, and the name alone is not enough to tell.
      with: {
        sender: { columns: { ...PUBLIC_USER_COLUMNS, email: true } },
      },
      orderBy: (fields, { desc }) => desc(fields.createdAt),
    });
  }

  static async getOutgoingRequests(userId: string) {
    return await db.query.friendRequests.findMany({
      where: and(
        eq(friendRequests.senderId, userId),
        eq(friendRequests.status, "pending")
      ),
      // You typed this address, so echoing it back reveals nothing new.
      with: {
        receiver: { columns: { ...PUBLIC_USER_COLUMNS, email: true } },
      },
      orderBy: (fields, { desc }) => desc(fields.createdAt),
    });
  }

  static async getPendingRequestCount(userId: string): Promise<number> {
    const rows = await db
      .select({ id: friendRequests.id })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.receiverId, userId),
          eq(friendRequests.status, "pending")
        )
      );

    return rows.length;
  }
}
