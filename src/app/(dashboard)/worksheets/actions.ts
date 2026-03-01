'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Log the access (user client — RLS-aware)
  await supabase.from('worksheet_access_log').insert({
    user_id: user.id,
    worksheet_id: worksheetId,
    access_type: accessType,
    counted_as_download: countsAsDownload,
  })

  // Update download counter for free tier users (admin client — bypasses
  // the protect_profile_fields trigger that blocks user-client writes
  // to monthly_download_count).
  // Count from the access log to avoid read-modify-write race conditions.
  if (countsAsDownload) {
    const admin = createAdminClient()
    const resetAt = profile.download_count_reset_at as string | null
    const needsReset = resetAt && new Date(resetAt) <= new Date()

    // Determine the start of the current billing window
    const windowStart = needsReset
      ? new Date().toISOString()
      : resetAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Count actual downloads in the current window (race-condition free)
    const { count: actualCount } = await admin
      .from('worksheet_access_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('counted_as_download', true)
      .gte('created_at', windowStart)

    const updateData: Record<string, unknown> = {
      monthly_download_count: actualCount ?? 1,
    }

    if (needsReset) {
      updateData.download_count_reset_at = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString()
    }

    await admin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
  }
}
