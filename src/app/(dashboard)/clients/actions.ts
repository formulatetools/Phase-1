'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { generateToken, generatePortalToken } from '@/lib/tokens'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  SubscriptionTier,
} from '@/types/database'
import { validateClientLabel } from '@/lib/validation/client-label'
import { generatePreviewHash } from '@/lib/preview'

// ============================================================================
// CLIENT (THERAPEUTIC RELATIONSHIP) ACTIONS
// ============================================================================

export async function createClient_action(label: string) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  // PII validation — reject obvious identifiable information
  const validation = validateClientLabel(label)
  if (!validation.valid) return { error: validation.error! }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Check freemium limits (only count clinical relationships)
  const { count } = await supabase
    .from('therapeutic_relationships')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'clinical')
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
      relationship_type: 'clinical',
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

  // PII validation — reject obvious identifiable information
  const validation = validateClientLabel(label)
  if (!validation.valid) return { error: validation.error! }

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

  // Guard: verify this is a clinical relationship (not supervision)
  const { data: rel } = await supabase
    .from('therapeutic_relationships')
    .select('relationship_type, client_portal_token')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!rel) return { error: 'Client not found' }
  if (rel.relationship_type !== 'clinical') {
    return { error: 'Cannot assign homework to a supervision relationship. Use the supervision portal instead.' }
  }

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

  // Lazy-generate client portal token if this relationship doesn't have one yet
  if (!rel.client_portal_token) {
    await supabase
      .from('therapeutic_relationships')
      .update({ client_portal_token: generatePortalToken() })
      .eq('id', relationshipId)
  }

  revalidatePath(`/clients/${relationshipId}`)
  return { data: data as WorksheetAssignment, token }
}

export async function getPreviewUrl(assignmentId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: assignment } = await supabase
    .from('worksheet_assignments')
    .select('id, token, therapist_id')
    .eq('id', assignmentId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!assignment) return { error: 'Assignment not found' }

  const hash = generatePreviewHash(assignment.token)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'
  return { url: `${appUrl}/hw/${assignment.token}?preview=${hash}` }
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

// ============================================================================
// GDPR ERASURE — PERMANENT DELETION
// ============================================================================

export async function gdprErase(relationshipId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!relationship) return { error: 'Client not found or already deleted' }

  // Count records for audit
  const { count: responseCount } = await supabase
    .from('worksheet_responses')
    .select('*', { count: 'exact', head: true })
    .eq('relationship_id', relationshipId)

  const { count: assignmentCount } = await supabase
    .from('worksheet_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('relationship_id', relationshipId)

  // Hard-delete all worksheet responses linked to this relationship
  const { error: respError } = await supabase
    .from('worksheet_responses')
    .delete()
    .eq('relationship_id', relationshipId)

  if (respError) return { error: `Failed to delete responses: ${respError.message}` }

  // Hard-delete all worksheet assignments linked to this relationship
  const { error: assignError } = await supabase
    .from('worksheet_assignments')
    .delete()
    .eq('relationship_id', relationshipId)

  if (assignError) return { error: `Failed to delete assignments: ${assignError.message}` }

  // Hard-delete the therapeutic relationship
  const { error: relError } = await supabase
    .from('therapeutic_relationships')
    .delete()
    .eq('id', relationshipId)

  if (relError) return { error: `Failed to delete relationship: ${relError.message}` }

  // Audit log — record the erasure (no PII stored, just counts)
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'gdpr_erasure',
    entity_type: 'therapeutic_relationship',
    entity_id: relationshipId,
    metadata: {
      responses_deleted: responseCount ?? 0,
      assignments_deleted: assignmentCount ?? 0,
    },
  })

  revalidatePath('/clients')
  return { success: true, deleted: { responses: responseCount ?? 0, assignments: assignmentCount ?? 0 } }
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

export async function markAsPaperCompleted(assignmentId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('worksheet_assignments')
    .update({
      status: 'completed',
      completion_method: 'paper',
      completed_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'worksheet_assignment',
    entity_id: assignmentId,
    metadata: { action: 'marked_as_paper_completed' },
  })

  revalidatePath('/clients')
  return { success: true }
}
