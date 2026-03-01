import { createServiceClient } from '@/lib/supabase/service'
import { hashIP } from '@/lib/utils/ip-hash'

/**
 * Rate limiting for PIN verification attempts.
 * Two dimensions: per-relationship and per-IP, both within a 15-minute window.
 * This protects the small 4-digit PIN keyspace from brute force.
 */

const WINDOW_MINUTES = 15
const MAX_PER_RELATIONSHIP = 5
const MAX_PER_IP = 20

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
}

/** Check if a PIN attempt is allowed under rate limits */
export async function checkPinRateLimit(
  relationshipId: string,
  ip: string
): Promise<RateLimitResult> {
  const supabase = createServiceClient()
  const ipHash = hashIP(ip)
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  const [{ count: relCount }, { count: ipCount }] = await Promise.all([
    supabase
      .from('portal_pin_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('relationship_id', relationshipId)
      .eq('success', false)
      .gte('attempted_at', windowStart),
    supabase
      .from('portal_pin_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('success', false)
      .gte('attempted_at', windowStart),
  ])

  const relFailed = relCount ?? 0
  const ipFailed = ipCount ?? 0

  if (relFailed >= MAX_PER_RELATIONSHIP || ipFailed >= MAX_PER_IP) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: WINDOW_MINUTES * 60,
    }
  }

  return {
    allowed: true,
    remaining: MAX_PER_RELATIONSHIP - relFailed,
  }
}

/** Record a PIN attempt (success or failure) for rate limiting */
export async function recordPinAttempt(
  relationshipId: string,
  ip: string,
  success: boolean
): Promise<void> {
  const supabase = createServiceClient()
  const ipHash = hashIP(ip)

  await supabase.from('portal_pin_attempts').insert({
    relationship_id: relationshipId,
    ip_hash: ipHash,
    success,
  })
}
