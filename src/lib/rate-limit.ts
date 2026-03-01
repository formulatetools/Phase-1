// In-memory sliding window rate limiter for Vercel Edge Runtime.
// State persists within a single Edge isolate (same region/instance).
// Not globally consistent, but sufficient for abuse prevention at startup scale.

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store) {
    const cutoff = now - windowMs
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  cleanup(windowMs)

  const entry = store.get(key) || { timestamps: [] }
  const cutoff = now - windowMs

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  const resetAt = Math.ceil(
    (entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs) / 1000
  )

  if (entry.timestamps.length >= limit) {
    store.set(key, entry)
    return { allowed: false, limit, remaining: 0, resetAt }
  }

  entry.timestamps.push(now)
  store.set(key, entry)

  return {
    allowed: true,
    limit,
    remaining: limit - entry.timestamps.length,
    resetAt,
  }
}

// Route-specific rate limit config
export const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/checkout': { limit: 10, windowMs: 60_000 },
  '/api/portal': { limit: 10, windowMs: 60_000 },
  '/api/homework': { limit: 30, windowMs: 60_000 },
  '/api/homework/pdf-download': { limit: 30, windowMs: 60_000 },
  '/api/import-worksheet': { limit: 5, windowMs: 60_000 },
  '/api/blog/upload-image': { limit: 10, windowMs: 60_000 },
  '/api/blog/reactions': { limit: 30, windowMs: 60_000 },
}
