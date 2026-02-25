'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { roleGrantedEmail } from '@/lib/email-templates'
import type { ContributorRole, ContributorRoles } from '@/types/database'

export async function toggleContributorRole(
  userId: string,
  role: ContributorRole
): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const admin = createAdminClient()

  // Fetch target user's current state
  const { data: targetUser, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, full_name, contributor_roles, subscription_tier, subscription_status')
    .eq('id', userId)
    .single()

  if (fetchError || !targetUser) return

  const currentRoles = (targetUser.contributor_roles as ContributorRoles | null) || {
    clinical_contributor: false,
    clinical_reviewer: false,
    content_writer: false,
  }

  const newValue = !currentRoles[role]
  const updatedRoles = { ...currentRoles, [role]: newValue }

  // Build the update payload
  const updatePayload: Record<string, unknown> = {
    contributor_roles: updatedRoles,
  }

  if (newValue) {
    // ── Granting a role ─────────────────────────────────────────────────
    // Grant Practice-tier access if user is on free tier
    if (
      targetUser.subscription_status === 'free' &&
      targetUser.subscription_tier === 'free'
    ) {
      updatePayload.subscription_tier = 'standard' // 'standard' displays as "Practice"
    }
  } else {
    // ── Revoking a role ─────────────────────────────────────────────────
    // Check if any other roles are still active
    const anyRolesRemain = Object.values(updatedRoles).some(Boolean)

    if (!anyRolesRemain && targetUser.subscription_status === 'free') {
      // No contributor roles left — check if user has a valid promo
      const { data: latestPromo } = await admin
        .from('promo_redemptions')
        .select('access_expires_at')
        .eq('user_id', userId)
        .order('access_expires_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const hasValidPromo =
        latestPromo && new Date(latestPromo.access_expires_at) > new Date()

      if (!hasValidPromo) {
        updatePayload.subscription_tier = 'free'
      }
    }
  }

  // Apply the update
  const { error: updateError } = await admin
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (updateError) return

  // Audit log
  await admin.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'contributor_role',
    entity_id: userId,
    metadata: {
      role,
      granted: newValue,
      updated_roles: updatedRoles,
      tier_change: updatePayload.subscription_tier || null,
    },
  })

  // Send email when granting (not revoking)
  if (newValue && targetUser.email) {
    const grantedRoles = Object.entries(updatedRoles)
      .filter(([, active]) => active)
      .map(([r]) => r)

    const email = roleGrantedEmail(
      targetUser.full_name as string | null,
      grantedRoles
    )

    sendEmail({
      to: targetUser.email,
      subject: email.subject,
      html: email.html,
      emailType: 'role_granted',
    })
  }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
}
