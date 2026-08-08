import db from "@/db";
import { PUBLIC_USER_COLUMNS } from "@/db/schema";

import { VisibilityService } from "./visibility-service";

export type FeedScore = Awaited<
  ReturnType<typeof ScoreFilterService.getFilteredScores>
>[number];

export class ScoreFilterService {
  /**
   * Scores the viewer is allowed to see, newest first.
   *
   * `friendsOnly` is a display preference. Visibility itself is decided by
   * VisibilityService, which never returns an owner the viewer may not see -
   * so this cannot be widened from the query string.
   */
  static async getFilteredScores(
    viewerId: string,
    options?: {
      gameType?: string;
      limit?: number;
      daysBack?: number;
      friendsOnly?: boolean;
    }
  ) {
    const visibleUserIds = await VisibilityService.getVisibleScoreOwnerIds(
      viewerId,
      { friendsOnly: options?.friendsOnly }
    );

    return await db.query.gameScoreEntries.findMany({
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
      where(fields, operators) {
        const conditions = [operators.inArray(fields.userId, visibleUserIds)];

        if (options?.daysBack) {
          const daysAgo = new Date(
            Date.now() - options.daysBack * 24 * 60 * 60 * 1000
          );
          conditions.push(operators.gte(fields.createdAt, daysAgo));
        }

        if (options?.gameType) {
          conditions.push(operators.eq(fields.gameType, options.gameType));
        }

        return operators.and(...conditions);
      },
      with: {
        // Was `user: true`, which shipped every author's email address to
        // every viewer on every feed load.
        user: { columns: PUBLIC_USER_COLUMNS },
      },
      limit: options?.limit,
    });
  }

  static async getWeeklyFilteredScores(
    viewerId: string,
    friendsOnly?: boolean
  ) {
    return await this.getFilteredScores(viewerId, {
      daysBack: 7,
      friendsOnly,
    });
  }
}
