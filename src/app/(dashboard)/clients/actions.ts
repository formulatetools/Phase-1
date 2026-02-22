'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { generateToken } from '@/lib/tokens'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  SubscriptionTier,
} from '@/types/database'

// ============================================================================
// CLIENT (THERAPEUTIC RELATIONSHIP) ACTIONS
// ============================================================================

export async function createClient_action(label: string) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Check freemium limits
  const { count } = await supabase
    .from('therapeutic_relationships')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .is('deleted_at', null)

  const limit = TIER_LIMITS[tier].maxClients
  if (count !== null && count >= limit) {
    return { error: `Free plan is limited to ${limit} clients. Upgrade to add more.`, limitReached: true }
  }

  const { data, error } = await supabase
    .from('therapeutic_relationships')
    .insert({
      therapist_id: user.id,
      client_label: label.trim(),
      status: 'active',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'therapeutic_relationship',
    entity_id: (data as TherapeuticRelationship).id,
    metadata: { client_label: label.trim() },
  })

  revalidatePath('/clients')
  return { data: data as TherapeuticRelationship }
}

export async function updateClientLabel(relationshipId: string, label: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('therapeutic_relationships')
    .update({ client_label: label.trim() })
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${relationshipId}`)
  return { success: true }
}

export async function dischargeClient(relationshipId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('therapeutic_relationships')
    .update({ status: 'discharged', ended_at: new Date().toISOString() })
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${relationshipId}`)
  return { success: true }
}

export async function reactivateClient(relationshipId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('therapeutic_relationships')
    .update({ status: 'active', ended_at: null })
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${relationshipId}`)
  return { success: true }
}

// ============================================================================
// ASSIGNMENT ACTIONS
// ============================================================================

export async function createAssignment(
  relationshipId: string,
  worksheetId: string,
  dueDate?: string,
  expiresInDays: number = 7
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Check freemium limits — count active assignments (assigned or in_progress)
  const { count } = await supabase
    .from('worksheet_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .is('deleted_at', null)

  const limit = TIER_LIMITS[tier].maxActiveAssignments
  if (count !== null && count >= limit) {
    return { error: `Free plan is limited to ${limit} active assignments. Upgrade for unlimited.`, limitReached: true }
  }

  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { data, error } = await supabase
    .from('worksheet_assignments')
    .insert({
      worksheet_id: worksheetId,
      therapist_id: user.id,
      relationship_id: relationshipId,
      token,
      status: 'assigned',
      due_date: dueDate || null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'assign',
    entity_type: 'worksheet_assignment',
    entity_id: (data as WorksheetAssignment).id,
    metadata: { worksheet_id: worksheetId, relationship_id: relationshipId, token },
  })

  revalidatePath(`/clients/${relationshipId}`)
  return { data: data as WorksheetAssignment, token }
}

export async function lockAssignment(assignmentId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('worksheet_assignments')
    .update({ locked_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function markAsReviewed(assignmentId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('worksheet_assignments')
    .update({ status: 'reviewed' })
    .eq('id', assignmentId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'read',
    entity_type: 'worksheet_assignment',
    entity_id: assignmentId,
    metadata: { action: 'marked_as_reviewed' },
  })

  revalidatePath('/clients')
  return { success: true }
}
