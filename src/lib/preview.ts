import { createHmac, timingSafeEqual } from 'crypto'

// HMAC-based preview tokens for "Preview as Client" feature.
// The hash is derived from the assignment token + a server-side secret.
// Only the server can generate valid preview hashes.

const PREVIEW_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'formulate-preview-fallback'

export function generatePreviewHash(token: string): string {
  return createHmac('sha256', PREVIEW_SECRET)
    .update(`preview:${token}`)
    .digest('hex')
    .slice(0, 16)
}

export function isValidPreviewHash(token: string, hash: string): boolean {
  const expected = generatePreviewHash(token)
  if (expected.length !== hash.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(hash))
  } catch {
    return false
  }
}
