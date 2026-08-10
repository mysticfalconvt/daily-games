/**
 * Shared bounds for both timing signals. Imported by the client tracker, the
 * server action that stores measured times, and the feed that infers times
 * from post gaps, so a change here moves all three together.
 */

/**
 * A measured time (game opened -> score pasted) is discarded past this. Beyond
 * an hour and a half the player almost certainly opened the tab, wandered off,
 * and came back - that is not a solve time.
 */
export const MAX_MEASURED_MS = 90 * 60 * 1000;

/**
 * Anything faster than this is not a real solve of a daily puzzle - it is a
 * double-click on the link, or a score pasted from another device.
 */
export const MIN_MEASURED_MS = 5 * 1000;

/**
 * An inferred time (previous post -> this post) is discarded past this. Kept
 * tighter than the measured cap because a post gap is much weaker evidence:
 * an hour of silence usually means the player left, not that one puzzle took
 * an hour.
 */
export const MAX_INFERRED_MS = 60 * 60 * 1000;

/**
 * Below this, a post gap is someone pasting several scores they finished
 * earlier, not the time one puzzle took.
 */
export const MIN_INFERRED_MS = 30 * 1000;

/** `4m 12s`, `45s`, `1h 3m`. Drops seconds once minutes get large enough. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainderMinutes = minutes % 60;
  return remainderMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainderMinutes}m`;
}
