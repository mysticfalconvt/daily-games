import { and, eq } from "drizzle-orm";

import db from "@/db";
import {
    friendships,
    gameScoreEntries,
    scoreComments,
    scoreReactions
} from "@/db/schema";
import {
    EmojiType,
    ReactionSummary,
    ScoreComment,
    ScoreInteractions,
    ScoreReaction
} from "@/types/interactions";

export class ScoreInteractionService {
    /**
     * Create a new comment on a score
     */
    static async createComment(
        userId: string,
        scoreId: string,
        content: string
    ): Promise<ScoreComment> {
        // Validate content length
        if (!content || content.trim().length === 0) {
            throw new Error("Comment content cannot be empty");
        }

        if (content.length > 500) {
            throw new Error("Comment content cannot exceed 500 characters");
        }

        // Check if user can interact with this score
        const canInteract = await this.canUserInteractWithScore(userId, scoreId);
        if (!canInteract) {
            throw new Error("You do not have permission to comment on this score");
        }

        // Create the comment
        const [newComment] = await db.insert(scoreComments).values({
            scoreId,
            userId,
            content: content.trim(),
        }).returning();

        // Fetch the comment with user data
        const commentWithUser = await db.query.scoreComments.findFirst({
            where: eq(scoreComments.id, newComment.id),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        if (!commentWithUser) {
            throw new Error("Failed to create comment");
        }

        return {
            id: commentWithUser.id,
            scoreId: commentWithUser.scoreId,
            userId: commentWithUser.userId,
            content: commentWithUser.content,
            createdAt: commentWithUser.createdAt,
            updatedAt: commentWithUser.updatedAt,
            user: commentWithUser.user,
        };
    }

    /**
     * Delete a comment (only by the comment author)
     */
    static async deleteComment(userId: string, commentId: string): Promise<void> {
        // Find the comment and verify ownership
        const comment = await db.query.scoreComments.findFirst({
            where: eq(scoreComments.id, commentId),
        });

        if (!comment) {
            throw new Error("Comment not found");
        }

        if (comment.userId !== userId) {
            throw new Error("You can only delete your own comments");
        }

        // Delete the comment
        await db.delete(scoreComments).where(eq(scoreComments.id, commentId));
    }

    /**
     * Get all comments for a score
     */
    static async getCommentsForScore(scoreId: string): Promise<ScoreComment[]> {
        try {
            const comments = await db.query.scoreComments.findMany({
                where: eq(scoreComments.scoreId, scoreId),
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: (fields, { asc }) => asc(fields.createdAt),
            });

            return comments.map(comment => ({
                id: comment.id,
                scoreId: comment.scoreId,
                userId: comment.userId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                user: comment.user,
            }));
        } catch (error) {
            console.error(`Error fetching comments with relations for score ${scoreId}:`, error);

            // Fallback to simple query without relations
            try {
                console.log("Falling back to simple query without user relations");
                const simpleComments = await db.select().from(scoreComments).where(eq(scoreComments.scoreId, scoreId));

                return simpleComments.map(comment => ({
                    id: comment.id,
                    scoreId: comment.scoreId,
                    userId: comment.userId,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    user: {
                        id: comment.userId,
                        name: "Unknown User",
                        image: "",
                    },
                }));
            } catch (fallbackError) {
                console.error("Fallback query also failed:", fallbackError);
                throw error;
            }
        }
    }

    /**
     * Toggle a reaction on a score (add if not exists, remove if exists)
     */
    static async toggleReaction(
        userId: string,
        scoreId: string,
        emojiType: EmojiType
    ): Promise<void> {
        // Check if user can interact with this score
        const canInteract = await this.canUserInteractWithScore(userId, scoreId);
        if (!canInteract) {
            throw new Error("You do not have permission to react to this score");
        }

        // Check if reaction already exists
        const existingReaction = await db.query.scoreReactions.findFirst({
            where: and(
                eq(scoreReactions.scoreId, scoreId),
                eq(scoreReactions.userId, userId),
                eq(scoreReactions.emojiType, emojiType)
            ),
        });

        if (existingReaction) {
            // Remove the reaction
            await db.delete(scoreReactions).where(eq(scoreReactions.id, existingReaction.id));
        } else {
            // Add the reaction
            await db.insert(scoreReactions).values({
                scoreId,
                userId,
                emojiType,
            });
        }
    }

    /**
     * Get all reactions for a score
     */
    static async getReactionsForScore(scoreId: string): Promise<ScoreReaction[]> {
        try {
            const reactions = await db.query.scoreReactions.findMany({
                where: eq(scoreReactions.scoreId, scoreId),
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: (fields, { asc }) => asc(fields.createdAt),
            });

            return reactions.map(reaction => ({
                id: reaction.id,
                scoreId: reaction.scoreId,
                userId: reaction.userId,
                emojiType: reaction.emojiType as EmojiType,
                createdAt: reaction.createdAt,
                user: reaction.user,
            }));
        } catch (error) {
            console.error(`Error fetching reactions with relations for score ${scoreId}:`, error);

            // Fallback to simple query without relations
            try {
                console.log("Falling back to simple query without user relations");
                const simpleReactions = await db.select().from(scoreReactions).where(eq(scoreReactions.scoreId, scoreId));

                return simpleReactions.map(reaction => ({
                    id: reaction.id,
                    scoreId: reaction.scoreId,
                    userId: reaction.userId,
                    emojiType: reaction.emojiType as EmojiType,
                    createdAt: reaction.createdAt,
                    user: {
                        id: reaction.userId,
                        name: "Unknown User",
                        image: "",
                    },
                }));
            } catch (fallbackError) {
                console.error("Fallback query also failed:", fallbackError);
                throw error;
            }
        }
    }

    /**
     * Get reaction summary for a score (aggregated by emoji type)
     */
    static async getReactionSummary(
        scoreId: string,
        currentUserId?: string
    ): Promise<ReactionSummary> {
        try {
            const reactions = await this.getReactionsForScore(scoreId);

            const summary: ReactionSummary = {
                "👍": { count: 0, users: [], userHasReacted: false },
                "🔥": { count: 0, users: [], userHasReacted: false },
                "😮": { count: 0, users: [], userHasReacted: false },
                "😂": { count: 0, users: [], userHasReacted: false },
                "❤️": { count: 0, users: [], userHasReacted: false },
                "🎉": { count: 0, users: [], userHasReacted: false },
            };

            reactions.forEach(reaction => {
                const emojiType = reaction.emojiType;
                const emojiData = summary[emojiType];
                if (emojiData) {
                    emojiData.count++;
                    emojiData.users.push({
                        id: reaction.user.id,
                        name: reaction.user.name,
                    });

                    if (currentUserId && reaction.userId === currentUserId) {
                        emojiData.userHasReacted = true;
                    }
                }
            });

            return summary;
        } catch (error) {
            console.error(`Error generating reaction summary for score ${scoreId}:`, error);
            throw error;
        }
    }

    /**
     * Check if a user can interact with a score based on privacy settings
     */
    static async canUserInteractWithScore(
        userId: string,
        scoreId: string
    ): Promise<boolean> {
        // Get the score and its owner
        const score = await db.query.gameScoreEntries.findFirst({
            where: eq(gameScoreEntries.id, scoreId),
            with: {
                user: {
                    columns: {
                        id: true,
                        isPrivate: true,
                    },
                },
            },
        });

        if (!score) {
            return false;
        }

        // Users can always interact with their own scores
        if (score.userId === userId) {
            return true;
        }

        // If the score owner has public settings, anyone can interact
        if (!score.user.isPrivate) {
            return true;
        }

        // If the score owner has private settings, check if they are friends
        const friendship = await db.query.friendships.findFirst({
            where: and(
                eq(friendships.userId, score.userId),
                eq(friendships.friendId, userId)
            ),
        });

        return !!friendship;
    }

    /**
     * Get all interactions (comments and reactions) for a score
     */
    static async getInteractionsForScore(
        scoreId: string,
        currentUserId?: string
    ): Promise<ScoreInteractions> {
        try {
            const [comments, reactionSummary] = await Promise.all([
                this.getCommentsForScore(scoreId),
                this.getReactionSummary(scoreId, currentUserId),
            ]);

            return {
                comments,
                reactions: reactionSummary,
            };
        } catch (error) {
            console.error(`Error in getInteractionsForScore for score ${scoreId}:`, error);
            throw error;
        }
    }
}