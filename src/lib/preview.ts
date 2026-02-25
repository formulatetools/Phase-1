import { createHmac } from 'crypto'

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
  return generatePreviewHash(token) === hash
}
