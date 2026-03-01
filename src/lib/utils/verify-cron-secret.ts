import crypto from 'crypto'

/**
 * Timing-safe verification of the cron secret from the Authorization header.
 * Prevents timing side-channel attacks on the bearer token comparison.
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || !authHeader) return false

  const expected = `Bearer ${secret}`

  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(authHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false

  return crypto.timingSafeEqual(a, b)
}
