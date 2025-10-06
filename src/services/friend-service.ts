import { and, eq, or } from "drizzle-orm";

import db from "@/db";
import { friendRequests, friendships, users } from "@/db/schema";

export class FriendService {
    /**
     * Send a friend request by email address
     */
    static async sendFriendRequest(senderEmail: string, receiverEmail: string): Promise<void> {
        // Validate that sender is not trying to add themselves
        if (senderEmail === receiverEmail) {
            throw new Error("Cannot add yourself as a friend");
        }

        // Find sender and receiver users
        const sender = await db.query.users.findFirst({
            where: eq(users.email, senderEmail),
        });

        if (!sender) {
            throw new Error("Sender not found");
        }

        const receiver = await db.query.users.findFirst({
            where: eq(users.email, receiverEmail),
        });

        if (!receiver) {
            throw new Error("User not found");
        }

        // Check if they are already friends
        const existingFriendship = await db.query.friendships.findFirst({
            where: or(
                and(eq(friendships.userId, sender.id), eq(friendships.friendId, receiver.id)),
                and(eq(friendships.userId, receiver.id), eq(friendships.friendId, sender.id))
            ),
        });

        if (existingFriendship) {
            throw new Error("Already friends with this user");
        }

        // Check if there's already a pending request
        const existingRequest = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.senderId, sender.id),
                eq(friendRequests.receiverId, receiver.id),
                eq(friendRequests.status, "pending")
            ),
        });

        if (existingRequest) {
            throw new Error("Friend request already sent");
        }

        // Create the friend request
        await db.insert(friendRequests).values({
            senderId: sender.id,
            receiverId: receiver.id,
            status: "pending",
        });
    }

    /**
     * Accept a friend request and create bidirectional friendship
     */
    static async acceptFriendRequest(requestId: string, userId: string): Promise<void> {
        // Find the friend request
        const request = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.id, requestId),
                eq(friendRequests.receiverId, userId),
                eq(friendRequests.status, "pending")
            ),
        });

        if (!request) {
            throw new Error("Friend request not found or not authorized");
        }

        // Create bidirectional friendship
        await db.transaction(async (tx) => {
            // Create friendship from receiver to sender
            await tx.insert(friendships).values({
                userId: request.receiverId,
                friendId: request.senderId,
            });

            // Create friendship from sender to receiver
            await tx.insert(friendships).values({
                userId: request.senderId,
                friendId: request.receiverId,
            });

            // Update request status to accepted
            await tx
                .update(friendRequests)
                .set({
                    status: "accepted",
                    updatedAt: new Date()
                })
                .where(eq(friendRequests.id, requestId));
        });
    }

    /**
     * Decline a friend request
     */
    static async declineFriendRequest(requestId: string, userId: string): Promise<void> {
        // Verify the request exists and user is authorized
        const request = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.id, requestId),
                eq(friendRequests.receiverId, userId),
                eq(friendRequests.status, "pending")
            ),
        });

        if (!request) {
            throw new Error("Friend request not found or not authorized");
        }

        // Update request status to declined
        await db
            .update(friendRequests)
            .set({
                status: "declined",
                updatedAt: new Date()
            })
            .where(eq(friendRequests.id, requestId));
    }

    /**
     * Cancel a sent friend request
     */
    static async cancelFriendRequest(requestId: string, userId: string): Promise<void> {
        // Verify the request exists and user is the sender
        const request = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.id, requestId),
                eq(friendRequests.senderId, userId),
                eq(friendRequests.status, "pending")
            ),
        });

        if (!request) {
            throw new Error("Friend request not found or not authorized");
        }

        // Delete the request
        await db.delete(friendRequests).where(eq(friendRequests.id, requestId));
    }

    /**
     * Remove an existing friendship (bidirectional removal)
     */
    static async removeFriend(userId: string, friendId: string): Promise<void> {
        // Remove both directions of the friendship
        await db.transaction(async (tx) => {
            await tx.delete(friendships).where(
                and(eq(friendships.userId, userId), eq(friendships.friendId, friendId))
            );

            await tx.delete(friendships).where(
                and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
            );
        });
    }

    /**
     * Get user's friends list
     */
    static async getFriends(userId: string) {
        const userFriendships = await db.query.friendships.findMany({
            where: eq(friendships.userId, userId),
            with: {
                friend: true,
            },
        });

        return userFriendships.map(friendship => friendship.friend);
    }

    /**
     * Get incoming friend requests for a user
     */
    static async getIncomingRequests(userId: string) {
        return await db.query.friendRequests.findMany({
            where: and(
                eq(friendRequests.receiverId, userId),
                eq(friendRequests.status, "pending")
            ),
            with: {
                sender: true,
            },
            orderBy: (fields, { desc }) => desc(fields.createdAt),
        });
    }

    /**
     * Get outgoing friend requests for a user
     */
    static async getOutgoingRequests(userId: string) {
        return await db.query.friendRequests.findMany({
            where: and(
                eq(friendRequests.senderId, userId),
                eq(friendRequests.status, "pending")
            ),
            with: {
                receiver: true,
            },
            orderBy: (fields, { desc }) => desc(fields.createdAt),
        });
    }

    /**
     * Get count of pending incoming friend requests
     */
    static async getPendingRequestCount(userId: string): Promise<number> {
        const requests = await db.query.friendRequests.findMany({
            where: and(
                eq(friendRequests.receiverId, userId),
                eq(friendRequests.status, "pending")
            ),
        });

        return requests.length;
    }
}