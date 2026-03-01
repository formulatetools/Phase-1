'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: boolean; error?: string }

// ── Create a new promo code (admin only) ─────────────────────────────────────

export async function createPromoCode(formData: FormData): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const code = (formData.get('code') as string)?.trim().toUpperCase()
  const tier = formData.get('tier') as string
  const durationDays = parseInt(formData.get('duration_days') as string, 10)
  const maxRedemptionsStr = formData.get('max_redemptions') as string
  const expiresAtStr = formData.get('expires_at') as string

  // Validation
  if (!code) return { success: false, error: 'Code is required' }
  if (!/^[A-Z0-9_-]{2,30}$/.test(code)) {
    return { success: false, error: 'Code must be 2-30 characters: letters, numbers, hyphens, underscores' }
  }
  if (!['starter', 'standard', 'professional'].includes(tier)) return { success: false, error: 'Invalid tier' }
  if (!durationDays || durationDays <= 0) return { success: false, error: 'Duration must be positive' }
  if (durationDays > 365) return { success: false, error: 'Duration cannot exceed 365 days' }

  const maxRedemptions = maxRedemptionsStr ? parseInt(maxRedemptionsStr, 10) : null
  if (maxRedemptions !== null && (maxRedemptions <= 0 || !Number.isInteger(maxRedemptions))) {
    return { success: false, error: 'Max redemptions must be a positive integer' }
  }
  const expiresAt = expiresAtStr ? new Date(expiresAtStr).toISOString() : null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code,
      tier,
      duration_days: durationDays,
      max_redemptions: maxRedemptions,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (error || !data) return { success: false, error: error?.message || 'Failed to create promo code' }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'promo_code',
    entity_id: data.id,
    metadata: { code, tier, duration_days: durationDays },
  })

  revalidatePath('/admin/promo-codes')
  return { success: true }
}

// ── Toggle a promo code's active status (admin only) ─────────────────────────

export async function togglePromoCodeActive(id: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch current state
  const { data: promo, error: fetchError } = await supabase
    .from('promo_codes')
    .select('is_active')
    .eq('id', id)
    .single()

  if (fetchError || !promo) return { success: false, error: 'Promo code not found' }

  const newActive = !promo.is_active

  const { error: updateError } = await supabase
    .from('promo_codes')
    .update({ is_active: newActive })
    .eq('id', id)

  if (updateError) return { success: false, error: 'Failed to update promo code' }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'promo_code',
    entity_id: id,
    metadata: { is_active: newActive },
  })

  revalidatePath('/admin/promo-codes')
  return { success: true }
}
