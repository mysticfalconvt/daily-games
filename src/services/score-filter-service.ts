import { eq, inArray, not, or } from "drizzle-orm";

import db from "@/db";
import { friendships, users } from "@/db/schema";

export class ScoreFilterService {
    /**
     * Get user's friend IDs
     */
    static async getUserFriendIds(userId: string): Promise<string[]> {
        const userFriendships = await db.query.friendships.findMany({
            where: eq(friendships.userId, userId),
        });

        return userFriendships.map(friendship => friendship.friendId);
    }

    /**
     * Check if user should see all users (when they have no friends)
     */
    static async shouldShowAllUsers(userId: string): Promise<boolean> {
        const friendIds = await this.getUserFriendIds(userId);
        return friendIds.length === 0;
    }

    /**
     * Get user IDs that are visible to the current user (respecting privacy settings)
     */
    static async getVisibleUserIds(userId: string, showAllUsers: boolean = false): Promise<string[]> {
        const friendIds = await this.getUserFriendIds(userId);

        if (showAllUsers || friendIds.length === 0) {
            // Get all users who are either not private OR are friends with the current user
            const visibleUsers = await db.query.users.findMany({
                where: or(
                    not(users.isPrivate), // User is not private
                    eq(users.id, userId), // Current user (always see own scores)
                    inArray(users.id, friendIds) // User is a friend
                ),
                columns: {
                    id: true,
                },
            });

            return visibleUsers.map(user => user.id);
        } else {
            // Only show friends + current user
            return [...friendIds, userId];
        }
    }

    /**
     * Get filtered scores based on friendship status
     */
    static async getFilteredScores(userId: string, options?: {
        gameType?: string;
        limit?: number;
        daysBack?: number;
        showAllUsers?: boolean;
    }) {
        const showAllUsers = options?.showAllUsers || await this.shouldShowAllUsers(userId);

        // Get visible user IDs based on privacy settings and friendship status
        const visibleUserIds = await this.getVisibleUserIds(userId, showAllUsers);

        return await db.query.gameScoreEntries.findMany({
            orderBy(fields, operators) {
                return operators.desc(fields.createdAt);
            },
            where(fields, operators) {
                const conditions = [operators.inArray(fields.userId, visibleUserIds)];

                // Filter by date if specified
                if (options?.daysBack) {
                    const daysAgo = new Date(Date.now() - options.daysBack * 24 * 60 * 60 * 1000);
                    conditions.push(operators.gte(fields.createdAt, daysAgo));
                }

                // Filter by game type if specified
                if (options?.gameType) {
                    conditions.push(operators.eq(fields.gameType, options.gameType));
                }

                return operators.and(...conditions);
            },
            with: {
                user: true,
            },
            limit: options?.limit,
        });
    }

    /**
     * Get filtered scores for the last week (matching current ScoreCardList behavior)
     */
    static async getWeeklyFilteredScores(userId: string, showAllUsers?: boolean) {
        return await this.getFilteredScores(userId, { daysBack: 7, showAllUsers });
    }

    /**
     * Get all users' scores for the last week (ignoring friendship filtering)
     */
    static async getWeeklyAllScores(userId: string) {
        return await this.getFilteredScores(userId, { daysBack: 7, showAllUsers: true });
    }
}