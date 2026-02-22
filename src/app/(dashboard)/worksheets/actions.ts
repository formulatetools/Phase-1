'use server'

import { createClient } from '@/lib/supabase/server'

export async function trackAccess(
  worksheetId: string,
  accessType: 'view' | 'interact' | 'export'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, monthly_download_count, download_count_reset_at')
    .eq('id', user.id)
    .single()

  if (!profile) return

  const isFreeTier = profile.subscription_tier === 'free'
  const countsAsDownload =
    isFreeTier && (accessType === 'interact' || accessType === 'export')

  // Log the access
  await supabase.from('worksheet_access_log').insert({
    user_id: user.id,
    worksheet_id: worksheetId,
    access_type: accessType,
    counted_as_download: countsAsDownload,
  })

  // Update download counter for free tier users
  if (countsAsDownload) {
    const resetAt = profile.download_count_reset_at as string | null
    if (resetAt && new Date(resetAt) <= new Date()) {
      // Reset counter and set new reset date
      await supabase
        .from('profiles')
        .update({
          monthly_download_count: 1,
          download_count_reset_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', user.id)
    } else {
      // Increment counter
      const currentCount = (profile.monthly_download_count as number) ?? 0
      await supabase
        .from('profiles')
        .update({ monthly_download_count: currentCount + 1 })
        .eq('id', user.id)
    }
  }
}
