import { createHmac } from 'crypto'

/**
 * One-way keyed hash of an IP address using HMAC-SHA256.
 * Uses a server-side secret as the key so that the hash cannot be
 * reversed via rainbow table (IPv4 is only ~4 billion addresses).
 * Stores the hash for GDPR consent audit trail without retaining the raw IP.
 */
const IP_HASH_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'formulate-ip-hash-fallback'

export function hashIP(ip: string): string {
  return createHmac('sha256', IP_HASH_KEY).update(ip).digest('hex')
}
