import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'
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

  // ── Lazy promo expiry check ────────────────────────────────────────────
  // A promo user has subscription_status='free' but subscription_tier!='free'.
  // If their latest redemption has expired, revert them to the free tier.
  // Contributors with active roles keep their tier regardless of promo status.
  const roles = profile?.contributor_roles as { clinical_contributor?: boolean; clinical_reviewer?: boolean; content_writer?: boolean } | null
  const hasContributorRole = roles?.clinical_contributor || roles?.clinical_reviewer || roles?.content_writer

  if (
    profile &&
    profile.subscription_status === 'free' &&
    profile.subscription_tier !== 'free' &&
    !hasContributorRole
  ) {
    const { data: latest } = await supabase
      .from('promo_redemptions')
      .select('access_expires_at')
      .eq('user_id', user.id)
      .order('access_expires_at', { ascending: false })
      .limit(1)
      .single()

    if (latest && new Date(latest.access_expires_at) < new Date()) {
      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', user.id)

      profile = { ...profile, subscription_tier: 'free' } as Profile
    }
  }

  return { user, profile: profile as Profile | null }
})
