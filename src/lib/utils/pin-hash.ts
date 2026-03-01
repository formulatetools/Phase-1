import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'

/**
 * PIN hashing using PBKDF2-SHA256 with high iteration count.
 * A 4-digit PIN has only 10,000 possible values, so the hash must be
 * deliberately expensive to resist offline brute-force if the hash leaks.
 * 600k iterations follows OWASP 2023 guidance for PBKDF2-SHA256.
 */

const PIN_ITERATIONS = 600_000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

/** Generate a random 16-byte hex salt (unique per relationship) */
export function generatePinSalt(): string {
  return randomBytes(16).toString('hex')
}

/** Hash a 4-digit PIN with a salt using PBKDF2 */
export function hashPin(pin: string, salt: string): string {
  return pbkdf2Sync(pin, salt, PIN_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
}

/** Verify a PIN against a stored hash using constant-time comparison */
export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  const computed = pbkdf2Sync(pin, salt, PIN_ITERATIONS, KEY_LENGTH, DIGEST)
  const stored = Buffer.from(storedHash, 'hex')

  if (computed.length !== stored.length) return false
  return timingSafeEqual(computed, stored)
}
