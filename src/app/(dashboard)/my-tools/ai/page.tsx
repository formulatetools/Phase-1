import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { SubscriptionTier } from '@/types/database'
import { AIGeneratePage } from '@/components/my-tools/ai-generate-page'

export const metadata = { title: 'AI Generate — Formulate' }

export default async function AIGenerateRoute() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const tier = profile.subscription_tier as SubscriptionTier
  const limit = TIER_LIMITS[tier].maxCustomWorksheets

  // Free tier cannot create custom worksheets
  if (limit === 0) redirect('/my-tools')

  const supabase = await createClient()

  // Check if at worksheet limit
  const { count } = await supabase
    .from('worksheets')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)

  const atLimit = count !== null && count >= limit

  return <AIGeneratePage tier={tier} atLimit={atLimit} />
}
