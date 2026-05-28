/**
 * In-memory sliding-window rate limiter. The app runs as a single
 * `next start` Node process inside one Docker container, so a process-wide
 * Map is shared across all requests — no Redis/Upstash needed at this scale.
 * (If the app is ever horizontally scaled, swap this for Upstash Ratelimit;
 * the call sites stay the same.)
 *
 * Buckets self-expire; a periodic sweep prevents unbounded growth.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

// Sweep expired buckets once a minute. unref() so this timer never keeps the
// process alive on its own.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (now > b.resetAt) buckets.delete(k);
  }
}, 60_000);
sweep.unref?.();

/** Common window presets in ms. */
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
