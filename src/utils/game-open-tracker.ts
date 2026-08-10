import { MAX_MEASURED_MS } from "./game-timing";

/**
 * Remembers when the player opened each game so the score form can report how
 * long the puzzle took.
 *
 * localStorage rather than sessionStorage: the game opens in a new tab and
 * people often reload or come back to the app later in the day, which would
 * wipe a session store. That also means this is per-device - a puzzle played
 * on a phone and posted on a laptop has no record here, and the feed falls
 * back to the gap between posts.
 */

const STORAGE_KEY = "dailyGames.gameOpens";

type GameOpens = Record<string, number>;

function read(): GameOpens {
  // Guards SSR and the private-mode browsers where touching localStorage
  // throws. Timing is a nice-to-have, so every failure here is silent.
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, openedAt]) => typeof openedAt === "number" && openedAt > 0
      )
    ) as GameOpens;
  } catch {
    return {};
  }
}

function write(opens: GameOpens): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(opens));
  } catch {
    // Quota or private mode. Nothing to do.
  }
}

/** Drops entries too old to ever produce a usable time. */
function prune(opens: GameOpens, now: number): GameOpens {
  return Object.fromEntries(
    Object.entries(opens).filter(
      ([, openedAt]) => now - openedAt <= MAX_MEASURED_MS
    )
  );
}

/**
 * Called when the player clicks through to a game.
 *
 * An existing click is kept rather than overwritten: someone who plays, then
 * re-opens the game to look at the answer before posting, should still be
 * credited from when they actually started. Only once the first click has
 * aged out do we treat a click as a fresh start.
 */
export function recordGameOpen(gameType: string): void {
  const now = Date.now();
  const opens = prune(read(), now);

  if (opens[gameType] === undefined) {
    opens[gameType] = now;
  }

  write(opens);
}

/**
 * Elapsed ms since the game was opened, or null if there is no usable record.
 * Does not clear the record - the score may not be submitted yet.
 */
export function peekElapsedSinceOpen(gameType: string): number | null {
  const openedAt = read()[gameType];
  if (openedAt === undefined) return null;

  const elapsed = Date.now() - openedAt;
  if (elapsed < 0 || elapsed > MAX_MEASURED_MS) return null;

  return elapsed;
}

/** Called once a score has been submitted, so the next play starts clean. */
export function clearGameOpen(gameType: string): void {
  const opens = prune(read(), Date.now());
  delete opens[gameType];
  write(opens);
}
