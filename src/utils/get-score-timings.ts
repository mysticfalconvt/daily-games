import { MAX_INFERRED_MS, MIN_INFERRED_MS } from "./game-timing";

type TimeableScore = {
  id: string;
  userId: string;
  createdAt: Date | string;
  durationMs?: number | null;
};

export type ScoreTiming = {
  ms: number;
  /**
   * True when the client actually timed the play (game opened from the app,
   * score pasted afterwards). False when it is inferred from the gap since
   * that player's previous post, which is a rough proxy at best.
   */
  measured: boolean;
};

/**
 * How long each score took, keyed by score id.
 *
 * A stored duration always wins. Otherwise we fall back to the gap since that
 * same player's previous post - if you post Wordle and then Connections eleven
 * minutes later, eleven minutes is a fair guess at the Connections play.
 *
 * Feed the whole fetched window in, not one day or one game type: the previous
 * post is usually under a different game.
 */
export function getScoreTimings(
  scores: TimeableScore[]
): Map<string, ScoreTiming> {
  const timings = new Map<string, ScoreTiming>();

  const byUser = new Map<string, TimeableScore[]>();
  for (const score of scores) {
    const existing = byUser.get(score.userId);
    if (existing) {
      existing.push(score);
    } else {
      byUser.set(score.userId, [score]);
    }
  }

  const postedAt = (score: TimeableScore) =>
    new Date(score.createdAt).getTime();

  for (const userScores of byUser.values()) {
    // The feed arrives newest first; gaps need the opposite.
    const ordered = [...userScores].sort((a, b) => postedAt(a) - postedAt(b));

    ordered.forEach((score, index) => {
      if (score.durationMs != null) {
        timings.set(score.id, { ms: score.durationMs, measured: true });
        return;
      }

      const previous = ordered[index - 1];
      if (!previous) return;

      const gap = postedAt(score) - postedAt(previous);

      // Too long means they walked away between puzzles. Too short means they
      // played earlier and are pasting a backlog of scores in one sitting -
      // crediting that puzzle with eight seconds would be nonsense.
      if (gap < MIN_INFERRED_MS || gap > MAX_INFERRED_MS) return;

      timings.set(score.id, { ms: gap, measured: false });
    });
  }

  return timings;
}
