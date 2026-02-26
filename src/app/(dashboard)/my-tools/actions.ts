'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { validateCustomSchema } from '@/lib/validation/custom-worksheet'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import type { SubscriptionTier, ContributorRoles, ContributorProfile } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import { convertLegacyFormulation } from '@/lib/utils/convert-legacy-formulation'

// ============================================================================
// HELPERS
// ============================================================================

function generateSlug(title: string, id: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  return `${baseSlug}-${id.slice(0, 8)}`
}

// ============================================================================
// CREATE CUSTOM WORKSHEET
// ============================================================================

export async function createCustomWorksheet(
  title: string,
  description: string,
  instructions: string,
  schema: WorksheetSchema,
  categoryId: string | null,
  tags: string[],
  estimatedMinutes: number | null
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  if (!title.trim()) return { error: 'Title is required' }
  if (!description.trim()) return { error: 'Description is required' }

  // Validate schema
  const schemaValidation = validateCustomSchema(schema)
  if (!schemaValidation.valid) return { error: schemaValidation.error! }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Check tier limit
  const limit = TIER_LIMITS[tier].maxCustomWorksheets
  if (limit === 0) {
    return { error: 'Custom worksheets are not available on the free plan. Upgrade to create your own tools.', limitReached: true }
  }

  const { count } = await supabase
    .from('worksheets')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)

  if (count !== null && count >= limit) {
    return {
      error: `Your plan is limited to ${limit} custom worksheets. Delete an existing one or upgrade to create more.`,
      limitReached: true,
    }
  }

  // Insert worksheet
  const { data, error } = await supabase
    .from('worksheets')
    .insert({
      title: title.trim(),
      slug: `custom-temp-${Date.now()}`, // will update with real slug after we have the ID
      description: description.trim(),
      instructions: instructions.trim(),
      schema,
      category_id: categoryId || null,
      tags: tags.filter(Boolean),
      estimated_minutes: estimatedMinutes,
      created_by: user.id,
      visibility: 'private',
      is_curated: false,
      is_published: false,
      is_premium: false,
      display_order: 0,
      schema_version: 1,
    } as Record<string, unknown>)
    .select()
    .single()

  if (error) return { error: error.message }

  // Update slug with actual ID
  const slug = generateSlug(title, (data as { id: string }).id)
  await supabase
    .from('worksheets')
    .update({ slug } as Record<string, unknown>)
    .eq('id', (data as { id: string }).id)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'worksheet',
    entity_id: (data as { id: string }).id,
    metadata: { title: title.trim(), custom: true },
  })

  revalidatePath('/my-tools')
  return { id: (data as { id: string }).id }
}

// ============================================================================
// SAVE IMPORTED RESPONSE (filled worksheet import → client)
// ============================================================================

export async function saveImportedResponse(
  worksheetId: string,
  relationshipId: string,
  responseData: Record<string, unknown>
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify the relationship belongs to this therapist and is active
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, therapist_id, status')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!relationship) return { error: 'Client not found or access denied' }

  // Verify the worksheet exists
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id')
    .eq('id', worksheetId)
    .is('deleted_at', null)
    .single()

  if (!worksheet) return { error: 'Worksheet not found' }

  const now = new Date().toISOString()
  const token = generateToken()

  // 1. Create a completed assignment record (has INSERT RLS policy)
  const { data: assignment, error: assignError } = await supabase
    .from('worksheet_assignments')
    .insert({
      worksheet_id: worksheetId,
      therapist_id: user.id,
      relationship_id: relationshipId,
      token,
      status: 'completed',
      assigned_at: now,
      expires_at: now, // Already completed — no future expiry needed
      completed_at: now,
    })
    .select()
    .single()

  if (assignError) return { error: `Failed to create assignment: ${assignError.message}` }

  // 2. Create the response record (no INSERT RLS policy → use admin client)
  const admin = createAdminClient()

  const { data: response, error: respError } = await admin
    .from('worksheet_responses')
    .insert({
      assignment_id: (assignment as { id: string }).id,
      worksheet_id: worksheetId,
      relationship_id: relationshipId,
      response_data: responseData,
      source: 'ai_generated',
      started_at: now,
      completed_at: now,
    })
    .select('id')
    .single()

  if (respError) {
    // Clean up the orphaned assignment
    await supabase
      .from('worksheet_assignments')
      .delete()
      .eq('id', (assignment as { id: string }).id)

    return { error: `Failed to save response: ${respError.message}` }
  }

  // 3. Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'worksheet_response',
    entity_id: (response as { id: string }).id,
    metadata: {
      source: 'ai_generated',
      worksheet_id: worksheetId,
      relationship_id: relationshipId,
      import_flow: true,
    },
  })

  revalidatePath(`/clients/${relationshipId}`)
  revalidatePath('/clients')
  return { success: true, responseId: (response as { id: string }).id }
}

// ============================================================================
// UPDATE CUSTOM WORKSHEET
// ============================================================================

export async function updateCustomWorksheet(
  worksheetId: string,
  title: string,
  description: string,
  instructions: string,
  schema: WorksheetSchema,
  categoryId: string | null,
  tags: string[],
  estimatedMinutes: number | null
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  if (!title.trim()) return { error: 'Title is required' }
  if (!description.trim()) return { error: 'Description is required' }

  // Validate schema
  const schemaValidation = validateCustomSchema(schema)
  if (!schemaValidation.valid) return { error: schemaValidation.error! }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('worksheets')
    .select('id, created_by')
    .eq('id', worksheetId)
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Worksheet not found or access denied' }

  const slug = generateSlug(title, worksheetId)

  const { error } = await supabase
    .from('worksheets')
    .update({
      title: title.trim(),
      slug,
      description: description.trim(),
      instructions: instructions.trim(),
      schema,
      category_id: categoryId || null,
      tags: tags.filter(Boolean),
      estimated_minutes: estimatedMinutes,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', worksheetId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'worksheet',
    entity_id: worksheetId,
    metadata: { title: title.trim(), custom: true },
  })

  revalidatePath('/my-tools')
  revalidatePath(`/my-tools/${worksheetId}`)
  return { success: true }
}

// ============================================================================
// DELETE CUSTOM WORKSHEET (soft delete)
// ============================================================================

export async function deleteCustomWorksheet(worksheetId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('worksheets')
    .select('id, created_by, title')
    .eq('id', worksheetId)
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Worksheet not found or access denied' }

  const { error } = await supabase
    .from('worksheets')
    .update({ deleted_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', worksheetId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'delete',
    entity_type: 'worksheet',
    entity_id: worksheetId,
    metadata: { title: (existing as { title: string }).title, custom: true, soft_delete: true },
  })

  revalidatePath('/my-tools')
  return { success: true }
}

// ============================================================================
// FORK (CUSTOMISE) A CURATED WORKSHEET
// ============================================================================

export async function forkWorksheet(sourceWorksheetId: string) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Check tier limit
  const limit = TIER_LIMITS[tier].maxCustomWorksheets
  if (limit === 0) {
    return { error: 'Custom worksheets are not available on the free plan. Upgrade to customise tools.', limitReached: true }
  }

  const { count } = await supabase
    .from('worksheets')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)

  if (count !== null && count >= limit) {
    return {
      error: `Your plan is limited to ${limit} custom worksheets. Delete an existing one or upgrade to create more.`,
      limitReached: true,
    }
  }

  // Fetch source worksheet
  const { data: source } = await supabase
    .from('worksheets')
    .select('*')
    .eq('id', sourceWorksheetId)
    .is('deleted_at', null)
    .single()

  if (!source) return { error: 'Source worksheet not found' }

  // Create the fork
  const typedSource = source as {
    id: string; title: string; description: string; instructions: string
    schema: WorksheetSchema; tags: string[]; estimated_minutes: number | null
    category_id: string | null
  }

  // Convert legacy formulation schemas to the new generalised format
  const convertedSchema = convertLegacyFormulation(typedSource.schema)

  const { data: forked, error } = await supabase
    .from('worksheets')
    .insert({
      title: `${typedSource.title} (Custom)`,
      slug: `custom-temp-${Date.now()}`,
      description: typedSource.description,
      instructions: typedSource.instructions,
      schema: convertedSchema,
      category_id: typedSource.category_id,
      tags: typedSource.tags || [],
      estimated_minutes: typedSource.estimated_minutes,
      created_by: user.id,
      forked_from: typedSource.id,
      visibility: 'private',
      is_curated: false,
      is_published: false,
      is_premium: false,
      display_order: 0,
      schema_version: 1,
    } as Record<string, unknown>)
    .select()
    .single()

  if (error) return { error: error.message }

  const forkedId = (forked as { id: string }).id

  // Update slug with real ID
  const slug = generateSlug(typedSource.title, forkedId)
  await supabase
    .from('worksheets')
    .update({ slug } as Record<string, unknown>)
    .eq('id', forkedId)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'fork' as string,
    entity_type: 'worksheet',
    entity_id: forkedId,
    metadata: { forked_from: sourceWorksheetId, source_title: typedSource.title },
  })

  revalidatePath('/my-tools')
  return { id: forkedId }
}

// ============================================================================
// SUBMIT TO LIBRARY (contributor flow)
// ============================================================================

export async function submitToLibrary(
  worksheetId: string,
  clinicalContext: string,
  suggestedCategory: string,
  referencesSources: string,
  acceptAgreement: boolean
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  // Must have clinical_contributor role
  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_contributor) {
    return { error: 'You do not have the Clinical Contributor role.' }
  }

  // Must have contributor profile completed
  const cp = profile.contributor_profile as ContributorProfile | null
  if (!cp?.display_name?.trim() || !cp?.professional_title?.trim()) {
    return { error: 'Please complete your contributor profile in Settings before submitting.' }
  }

  // Must accept agreement on first submission
  if (!profile.contributor_agreement_accepted_at && !acceptAgreement) {
    return { error: 'You must accept the contributor agreement before submitting.' }
  }

  // Validate clinical context
  if (!clinicalContext || clinicalContext.trim().length < 200) {
    return { error: 'Clinical context must be at least 200 characters.' }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  // Verify the user owns this worksheet
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, created_by, library_status, title')
    .eq('id', worksheetId)
    .eq('created_by', user.id)
    .is('deleted_at', null)
    .single()

  if (!worksheet) return { error: 'Worksheet not found or access denied' }

  // Don't allow re-submission if already submitted/in_review/approved/published
  const ws = worksheet as { library_status: string | null }
  if (ws.library_status && !['draft', 'rejected'].includes(ws.library_status)) {
    return { error: 'This worksheet has already been submitted.' }
  }

  // Record agreement acceptance if first time
  if (!profile.contributor_agreement_accepted_at && acceptAgreement) {
    await admin
      .from('profiles')
      .update({ contributor_agreement_accepted_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  // Update worksheet with submission data
  const { error } = await admin
    .from('worksheets')
    .update({
      library_status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: user.id,
      clinical_context: clinicalContext.trim(),
      suggested_category: suggestedCategory.trim() || null,
      references_sources: referencesSources.trim() || null,
      admin_feedback: null,
    })
    .eq('id', worksheetId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create' as string,
    entity_type: 'library_submission',
    entity_id: worksheetId,
    metadata: {
      title: (worksheet as { title: string }).title,
      suggested_category: suggestedCategory.trim() || null,
    },
  })

  revalidatePath('/my-tools')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================================
// RESUBMIT TO LIBRARY (after changes_requested)
// ============================================================================

export async function resubmitToLibrary(
  worksheetId: string,
  clinicalContext?: string,
  suggestedCategory?: string,
  referencesSources?: string
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_contributor) {
    return { error: 'You do not have the Clinical Contributor role.' }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  // Verify ownership and status
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, created_by, library_status, title')
    .eq('id', worksheetId)
    .eq('created_by', user.id)
    .is('deleted_at', null)
    .single()

  if (!worksheet) return { error: 'Worksheet not found or access denied' }

  const ws = worksheet as { library_status: string | null }
  if (ws.library_status !== 'changes_requested') {
    return { error: 'This worksheet is not awaiting changes.' }
  }

  // Build update payload — optionally update submission metadata
  const updatePayload: Record<string, unknown> = {
    library_status: 'submitted',
    submitted_at: new Date().toISOString(),
    admin_feedback: null,
  }

  if (clinicalContext?.trim()) {
    if (clinicalContext.trim().length < 200) {
      return { error: 'Clinical context must be at least 200 characters.' }
    }
    updatePayload.clinical_context = clinicalContext.trim()
  }
  if (suggestedCategory !== undefined) {
    updatePayload.suggested_category = suggestedCategory.trim() || null
  }
  if (referencesSources !== undefined) {
    updatePayload.references_sources = referencesSources.trim() || null
  }

  const { error } = await admin
    .from('worksheets')
    .update(updatePayload)
    .eq('id', worksheetId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update' as string,
    entity_type: 'library_submission',
    entity_id: worksheetId,
    metadata: { title: (worksheet as { title: string }).title, resubmission: true },
  })

  revalidatePath('/my-tools')
  revalidatePath('/dashboard')
  return { success: true }
}
