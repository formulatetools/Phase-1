'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TIER_LABELS } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import type { PromoCode } from '@/types/database'

// ── Validate a promo code (no auth required — used at signup) ────────────────

export async function validatePromoCode(code: string): Promise<
  | { valid: true; tier: string; tierLabel: string; durationDays: number }
  | { valid: false; error: string }
> {
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return { valid: false, error: 'Please enter a code' }

  const supabase = await createClient()

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .ilike('code', trimmed)
    .eq('is_active', true)
    .single()

  if (!promo) return { valid: false, error: 'Code not found' }

  const pc = promo as PromoCode

  // Check if the code itself has expired
  if (pc.expires_at && new Date(pc.expires_at) < new Date()) {
    return { valid: false, error: 'This code has expired' }
  }

  // Check max redemptions
  if (pc.max_redemptions !== null && pc.redemption_count >= pc.max_redemptions) {
    return { valid: false, error: 'This code has reached its redemption limit' }
  }

  return {
    valid: true,
    tier: pc.tier,
    tierLabel: TIER_LABELS[pc.tier] || pc.tier,
    durationDays: pc.duration_days,
  }
}

// ── Redeem a promo code (requires auth, free tier only) ──────────────────────

export async function redeemPromoCode(code: string): Promise<
  | { tier: string; tierLabel: string; durationDays: number }
  | { error: string }
> {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) return { error: 'Not authenticated' }
  if (profile.subscription_tier !== 'free') {
    return { error: 'Promo codes are only available for free-tier accounts' }
  }
  if (profile.subscription_status === 'active') {
    return { error: 'You already have an active subscription' }
  }

  // Validate the code
  const validation = await validatePromoCode(code)
  if (!validation.valid) return { error: validation.error }

  const supabase = await createClient()
  const trimmed = code.trim().toUpperCase()

  // Fetch the full promo code record (need the id)
  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .ilike('code', trimmed)
    .eq('is_active', true)
    .single()

  if (!promo) return { error: 'Code not found' }
  const pc = promo as PromoCode

  // Check if user already redeemed this code
  const { data: existing } = await supabase
    .from('promo_redemptions')
    .select('id')
    .eq('promo_code_id', pc.id)
    .eq('user_id', user.id)
    .single()

  if (existing) return { error: 'You have already redeemed this code' }

  // Calculate access expiry
  const accessExpiresAt = new Date(
    Date.now() + pc.duration_days * 24 * 60 * 60 * 1000
  ).toISOString()

  // Insert redemption record (user inserts own via RLS)
  const { error: insertError } = await supabase
    .from('promo_redemptions')
    .insert({
      promo_code_id: pc.id,
      user_id: user.id,
      access_expires_at: accessExpiresAt,
    })

  if (insertError) return { error: 'Failed to redeem code. Please try again.' }

  // Increment redemption count (admin client — bypasses RLS)
  const admin = createAdminClient()
  await admin
    .from('promo_codes')
    .update({ redemption_count: pc.redemption_count + 1 })
    .eq('id', pc.id)

  // Update user's subscription tier (admin client — RLS blocks user-level tier changes)
  await admin
    .from('profiles')
    .update({ subscription_tier: pc.tier })
    .eq('id', user.id)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'redeem',
    entity_type: 'promo_code',
    entity_id: pc.id,
    metadata: { code: pc.code, tier: pc.tier, duration_days: pc.duration_days },
  })

  revalidatePath('/dashboard')
  revalidatePath('/settings')

  return {
    tier: pc.tier,
    tierLabel: TIER_LABELS[pc.tier] || pc.tier,
    durationDays: pc.duration_days,
  }
}
