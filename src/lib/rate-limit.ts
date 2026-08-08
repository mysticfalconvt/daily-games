import { ApiError } from "./api";

type Bucket = { count: number; resetAt: number };

/**
 * Fixed-window limiter held in module memory.
 *
 * This is per-process, so it is a speed bump rather than a guarantee: it stops
 * a script from walking the user directory or flooding comments, but it resets
 * on deploy and would need Redis to hold across multiple instances. The app
 * runs as a single instance today.
 */
const buckets = new Map<string, Bucket>();

/** Keeps the map from growing without bound on a long-lived process. */
function sweep(now: number) {
  if (buckets.size < 5_000) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export type RateLimit = { limit: number; windowMs: number };

export const RATE_LIMITS = {
  userSearch: { limit: 30, windowMs: 60_000 },
  friendRequest: { limit: 10, windowMs: 60 * 60_000 },
  comment: { limit: 20, windowMs: 60_000 },
  reaction: { limit: 60, windowMs: 60_000 },
  impersonate: { limit: 20, windowMs: 60_000 },
} satisfies Record<string, RateLimit>;

export function enforceRateLimit(
  name: keyof typeof RATE_LIMITS,
  identifier: string
): void {
  const { limit, windowMs } = RATE_LIMITS[name];
  const now = Date.now();
  sweep(now);

  const key = `${name}:${identifier}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw new ApiError(
      429,
      "rate_limited",
      `Too many requests. Try again in ${retryAfter}s.`
    );
  }

  bucket.count += 1;
}
