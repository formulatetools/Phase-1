import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'
import { createAdminClient } from './admin'
import type { Profile } from '@/types/database'

// Server-side: get current user and profile.
// Wrapped in React.cache so that layout + page calls within the same
// request lifecycle share a single DB round-trip.
export const getCurrentUser = cache(async (): Promise<{
  user: User | null
  profile: Profile | null
}> => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null }
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // ── Lazy temporary-access expiry check ─────────────────────────────────
  // A user with subscription_status='free' but subscription_tier!='free'
  // has temporary access (via promo code or referral reward).
  // Check if ALL sources of temp access have expired; if so, revert to free.
  // Contributors with active roles keep their tier regardless.
  const roles = profile?.contributor_roles as { clinical_contributor?: boolean; clinical_reviewer?: boolean; content_writer?: boolean } | null
  const hasContributorRole = roles?.clinical_contributor || roles?.clinical_reviewer || roles?.content_writer

  if (
    profile &&
    profile.subscription_status === 'free' &&
    profile.subscription_tier !== 'free' &&
    !hasContributorRole
  ) {
    const now = new Date().toISOString()

    const [promoResult, refereeResult, referrerResult] = await Promise.all([
      // Active promo redemption
      supabase
        .from('promo_redemptions')
        .select('access_expires_at')
        .eq('user_id', user.id)
        .gt('access_expires_at', now)
        .limit(1),
      // Active referral reward as referee
      supabase
        .from('referrals')
        .select('referee_reward_expires_at')
        .eq('referee_id', user.id)
        .not('referee_reward_expires_at', 'is', null)
        .gt('referee_reward_expires_at', now)
        .limit(1),
      // Active referral reward as referrer
      supabase
        .from('referrals')
        .select('referrer_reward_expires_at')
        .eq('referrer_id', user.id)
        .not('referrer_reward_expires_at', 'is', null)
        .gt('referrer_reward_expires_at', now)
        .limit(1),
    ])

    const hasActiveAccess =
      (promoResult.data && promoResult.data.length > 0) ||
      (refereeResult.data && refereeResult.data.length > 0) ||
      (referrerResult.data && referrerResult.data.length > 0)

    if (!hasActiveAccess) {
      const admin = createAdminClient()
      await admin
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', user.id)

      profile = { ...profile, subscription_tier: 'free' } as Profile
    }
  }

  return { user, profile: profile as Profile | null }
})
