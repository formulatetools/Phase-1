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
import { validateSuperviseeLabel } from '@/lib/validation/supervisee-label'

// ============================================================================
// SUPERVISEE (SUPERVISION RELATIONSHIP) ACTIONS
// ============================================================================

export async function createSupervisee(label: string) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  // Validation — block obvious PII but allow names
  const validation = validateSuperviseeLabel(label)
  if (!validation.valid) return { error: validation.error! }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Check tier limits (only count supervision relationships)
  const limit = TIER_LIMITS[tier].maxSupervisees
  if (limit === 0) {
    return { error: 'Supervision is available on the Practice plan and above. Upgrade to access the supervision portal.', limitReached: true }
  }

  const { count } = await supabase
    .from('therapeutic_relationships')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')
    .is('deleted_at', null)

  if (count !== null && count >= limit) {
    return { error: `Your plan is limited to ${limit} supervisees. Upgrade to add more.`, limitReached: true }
  }

  const { data, error } = await supabase
    .from('therapeutic_relationships')
    .insert({
      therapist_id: user.id,
      client_label: label.trim(),
      status: 'active',
      relationship_type: 'supervision',
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
    metadata: { client_label: label.trim(), relationship_type: 'supervision' },
  })

  revalidatePath('/supervision')
  return { data: data as TherapeuticRelationship }
}

export async function updateSuperviseeLabel(relationshipId: string, label: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const validation = validateSuperviseeLabel(label)
  if (!validation.valid) return { error: validation.error! }

  const supabase = await createClient()

  const { error } = await supabase
    .from('therapeutic_relationships')
    .update({ client_label: label.trim() })
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')

  if (error) return { error: error.message }

  revalidatePath('/supervision')
  revalidatePath(`/supervision/${relationshipId}`)
  return { success: true }
}

export async function endSupervision(relationshipId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('therapeutic_relationships')
    .update({ status: 'discharged', ended_at: new Date().toISOString() })
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')

  if (error) return { error: error.message }

  revalidatePath('/supervision')
  revalidatePath(`/supervision/${relationshipId}`)
  return { success: true }
}

export async function reactivateSupervisee(relationshipId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('therapeutic_relationships')
    .update({ status: 'active', ended_at: null })
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')

  if (error) return { error: error.message }

  revalidatePath('/supervision')
  revalidatePath(`/supervision/${relationshipId}`)
  return { success: true }
}

// ============================================================================
// SUPERVISION ASSIGNMENT ACTIONS
// ============================================================================

export async function createSupervisionAssignment(
  relationshipId: string,
  worksheetId: string,
  dueDate?: string,
  expiresInDays: number = 7
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Guard: verify this is a supervision relationship (not clinical)
  const { data: rel } = await supabase
    .from('therapeutic_relationships')
    .select('relationship_type, client_portal_token')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!rel) return { error: 'Supervisee not found' }
  if (rel.relationship_type !== 'supervision') {
    return { error: 'Cannot assign supervision worksheets to a clinical client. Use the clients page instead.' }
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
    return { error: `Your plan is limited to ${limit} active assignments. Upgrade for unlimited.`, limitReached: true }
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
    metadata: { worksheet_id: worksheetId, relationship_id: relationshipId, token, supervision: true },
  })

  // Lazy-generate client portal token if this relationship doesn't have one yet
  if (!rel.client_portal_token) {
    await supabase
      .from('therapeutic_relationships')
      .update({ client_portal_token: generatePortalToken() })
      .eq('id', relationshipId)
  }

  revalidatePath(`/supervision/${relationshipId}`)
  return { data: data as WorksheetAssignment, token }
}

export async function lockSupervisionAssignment(assignmentId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('worksheet_assignments')
    .update({ locked_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/supervision')
  return { success: true }
}

export async function markSupervisionReviewed(assignmentId: string) {
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
    metadata: { action: 'marked_as_reviewed', supervision: true },
  })

  revalidatePath('/supervision')
  return { success: true }
}

export async function markSupervisionPaperCompleted(assignmentId: string) {
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
    metadata: { action: 'marked_as_paper_completed', supervision: true },
  })

  revalidatePath('/supervision')
  return { success: true }
}

// ============================================================================
// GDPR ERASURE — PERMANENT DELETION
// ============================================================================

export async function gdprEraseSupervision(relationshipId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership and that this is a supervision relationship
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')
    .is('deleted_at', null)
    .single()

  if (!relationship) return { error: 'Supervisee not found or already deleted' }

  // Count records for audit
  const { count: responseCount } = await supabase
    .from('worksheet_responses')
    .select('*', { count: 'exact', head: true })
    .eq('relationship_id', relationshipId)

  const { count: assignmentCount } = await supabase
    .from('worksheet_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('relationship_id', relationshipId)

  // Hard-delete all worksheet responses
  const { error: respError } = await supabase
    .from('worksheet_responses')
    .delete()
    .eq('relationship_id', relationshipId)

  if (respError) return { error: `Failed to delete responses: ${respError.message}` }

  // Hard-delete homework events linked to this relationship
  await supabase
    .from('homework_events')
    .delete()
    .eq('relationship_id', relationshipId)

  // Hard-delete homework consent records linked to this relationship
  await supabase
    .from('homework_consent')
    .delete()
    .eq('relationship_id', relationshipId)

  // Hard-delete all worksheet assignments
  const { error: assignError } = await supabase
    .from('worksheet_assignments')
    .delete()
    .eq('relationship_id', relationshipId)

  if (assignError) return { error: `Failed to delete assignments: ${assignError.message}` }

  // Hard-delete the relationship
  const { error: relError } = await supabase
    .from('therapeutic_relationships')
    .delete()
    .eq('id', relationshipId)

  if (relError) return { error: `Failed to delete relationship: ${relError.message}` }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'gdpr_erasure',
    entity_type: 'therapeutic_relationship',
    entity_id: relationshipId,
    metadata: {
      responses_deleted: responseCount ?? 0,
      assignments_deleted: assignmentCount ?? 0,
      relationship_type: 'supervision',
    },
  })

  revalidatePath('/supervision')
  return { success: true, deleted: { responses: responseCount ?? 0, assignments: assignmentCount ?? 0 } }
}
