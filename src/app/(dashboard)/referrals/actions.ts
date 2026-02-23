'use server'

import { createClient } from '@/lib/supabase/server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function getOrCreateReferralCode(): Promise<{ code: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check for existing code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .single()

  if (existing) return { code: existing.code }

  // Create new code with collision retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const { error } = await supabase
      .from('referral_codes')
      .insert({ user_id: user.id, code })

    if (!error) return { code }
    // If unique constraint violation, retry with new code
    if (error.code === '23505') continue
    return { error: error.message }
  }

  return { error: 'Failed to generate unique code' }
}

export async function getReferralStats(): Promise<{
  total: number
  converted: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, converted: 0 }

  const [
    { count: total },
    { count: converted },
  ] = await Promise.all([
    supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id),
    supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'converted'),
  ])

  return { total: total ?? 0, converted: converted ?? 0 }
}
