import { and, eq, inArray } from "drizzle-orm";

import db from "@/db";
import {
  PUBLIC_USER_COLUMNS,
  scoreComments,
  scoreReactions,
} from "@/db/schema";
import { badRequest, forbidden, notFound } from "@/lib/api";
import {
  EmojiType,
  ReactionSummary,
  ScoreComment,
  ScoreInteractions,
} from "@/types/interactions";

import { VisibilityService } from "./visibility-service";

const EMPTY_REACTION_SUMMARY = (): ReactionSummary => ({
  "👍": { count: 0, users: [], userHasReacted: false },
  "🔥": { count: 0, users: [], userHasReacted: false },
  "😮": { count: 0, users: [], userHasReacted: false },
  "😂": { count: 0, users: [], userHasReacted: false },
  "❤️": { count: 0, users: [], userHasReacted: false },
  "🎉": { count: 0, users: [], userHasReacted: false },
});

export const MAX_COMMENT_LENGTH = 500;

export class ScoreInteractionService {
  static async createComment(
    userId: string,
    scoreId: string,
    content: string
  ): Promise<ScoreComment> {
    const trimmed = content.trim();

    if (!trimmed) {
      throw badRequest("Comment content cannot be empty");
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw badRequest(
        `Comment content cannot exceed ${MAX_COMMENT_LENGTH} characters`
      );
    }

    await VisibilityService.requireInteractableScore(userId, scoreId);

    const [inserted] = await db
      .insert(scoreComments)
      .values({ scoreId, userId, content: trimmed })
      .returning();

    const comment = await db.query.scoreComments.findFirst({
      where: eq(scoreComments.id, inserted.id),
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
    });

    if (!comment) {
      throw new Error("Failed to load the comment that was just created");
    }

    return comment;
  }

  /**
   * Deletes a comment. The author can always remove their own; the owner of the
   * score can remove anything on their score, which is the only moderation
   * lever a user has over their own feed.
   */
  static async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await db.query.scoreComments.findFirst({
      where: eq(scoreComments.id, commentId),
      with: { score: { columns: { userId: true } } },
    });

    if (!comment) {
      throw notFound("Comment not found");
    }

    const isAuthor = comment.userId === userId;
    const ownsScore = comment.score?.userId === userId;

    if (!isAuthor && !ownsScore) {
      throw forbidden("You can only delete your own comments");
    }

    await db.delete(scoreComments).where(eq(scoreComments.id, commentId));
  }

  /**
   * Comments on a score, filtered to authors whose activity this viewer may
   * see. Callers must already have established that the viewer can see the
   * score itself - use `getInteractionsForScore`, which does both.
   */
  static async getCommentsForScore(
    scoreId: string,
    viewerId: string
  ): Promise<ScoreComment[]> {
    const visibleAuthorIds =
      await VisibilityService.getVisibleInteractionAuthorIds(viewerId);

    return await db.query.scoreComments.findMany({
      where: and(
        eq(scoreComments.scoreId, scoreId),
        inArray(scoreComments.userId, visibleAuthorIds)
      ),
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
      orderBy: (fields, { asc }) => asc(fields.createdAt),
    });
  }

  static async toggleReaction(
    userId: string,
    scoreId: string,
    emojiType: EmojiType
  ): Promise<void> {
    await VisibilityService.requireInteractableScore(userId, scoreId);

    const existing = await db.query.scoreReactions.findFirst({
      where: and(
        eq(scoreReactions.scoreId, scoreId),
        eq(scoreReactions.userId, userId),
        eq(scoreReactions.emojiType, emojiType)
      ),
    });

    if (existing) {
      await db.delete(scoreReactions).where(eq(scoreReactions.id, existing.id));
      return;
    }

    await db
      .insert(scoreReactions)
      .values({ scoreId, userId, emojiType })
      // The unique constraint makes a double-click a no-op rather than a 500.
      .onConflictDoNothing();
  }

  /**
   * Reaction tallies for a score, counting only reactors this viewer may see.
   * Counts are therefore per-viewer: a private user's reaction is invisible to
   * strangers, including in the number.
   */
  static async getReactionSummary(
    scoreId: string,
    viewerId: string
  ): Promise<ReactionSummary> {
    const visibleAuthorIds =
      await VisibilityService.getVisibleInteractionAuthorIds(viewerId);

    const reactions = await db.query.scoreReactions.findMany({
      where: and(
        eq(scoreReactions.scoreId, scoreId),
        inArray(scoreReactions.userId, visibleAuthorIds)
      ),
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
      orderBy: (fields, { asc }) => asc(fields.createdAt),
    });

    const summary = EMPTY_REACTION_SUMMARY();

    for (const reaction of reactions) {
      const entry = summary[reaction.emojiType as EmojiType];
      if (!entry) {
        continue;
      }

      entry.count += 1;
      entry.users.push({ id: reaction.user.id, name: reaction.user.name });
      if (reaction.userId === viewerId) {
        entry.userHasReacted = true;
      }
    }

    return summary;
  }

  /**
   * Everything attached to a score, for a viewer who is allowed to see it.
   * This is the only entry point the API should use: it checks score
   * visibility first, then filters authors.
   */
  static async getInteractionsForScore(
    scoreId: string,
    viewerId: string
  ): Promise<ScoreInteractions> {
    await VisibilityService.requireViewableScore(viewerId, scoreId);

    const [comments, reactions] = await Promise.all([
      this.getCommentsForScore(scoreId, viewerId),
      this.getReactionSummary(scoreId, viewerId),
    ]);

    return { comments, reactions };
  }
}
