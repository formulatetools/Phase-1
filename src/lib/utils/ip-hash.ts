import { createHash } from 'crypto'

/**
 * One-way SHA-256 hash of an IP address.
 * Stores the hash for GDPR consent audit trail without retaining the raw IP.
 */
export function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}
