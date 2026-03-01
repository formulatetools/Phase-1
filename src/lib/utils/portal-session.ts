import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

/**
 * Signed session cookie for PIN-verified portal sessions.
 * The cookie contains a relationship ID + timestamp, signed with HMAC-SHA256.
 * This prevents bypass via cookie forgery. The cookie is httpOnly, secure,
 * and scoped to /client/ paths only.
 */

const SESSION_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'formulate-pin-session-fallback'
const COOKIE_NAME = 'portal_pin_session'
const MAX_AGE_SECONDS = 24 * 60 * 60 // 24 hours

interface SessionPayload {
  rid: string // relationship ID
  vat: number // verified-at timestamp (epoch ms)
}

function sign(data: string): string {
  return createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')
}

/** Create a signed session token for a verified PIN session */
export function createSessionToken(relationshipId: string): string {
  const payload: SessionPayload = { rid: relationshipId, vat: Date.now() }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = sign(encoded)
  return `${encoded}.${sig}`
}

/** Verify a session token: check signature, expiry, and relationship match */
export function verifySessionToken(token: string, relationshipId: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [encoded, sig] = parts
  if (!encoded || !sig) return false

  // Verify signature
  const expectedSig = sign(encoded)
  if (sig !== expectedSig) return false

  // Decode and validate payload
  try {
    const payload: SessionPayload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString()
    )
    if (payload.rid !== relationshipId) return false
    const age = Date.now() - payload.vat
    if (age > MAX_AGE_SECONDS * 1000 || age < 0) return false
    return true
  } catch {
    return false
  }
}

/** Set a session cookie after successful PIN verification */
export async function setSessionCookie(relationshipId: string): Promise<void> {
  const token = createSessionToken(relationshipId)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/client/',
    maxAge: MAX_AGE_SECONDS,
  })
}

/** Check if the current request has a valid PIN session for the given relationship */
export async function isSessionValid(relationshipId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return false
  return verifySessionToken(cookie.value, relationshipId)
}

/** Clear the PIN session cookie */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/client/',
    maxAge: 0,
  })
}
