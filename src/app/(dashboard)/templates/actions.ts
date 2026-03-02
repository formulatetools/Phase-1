'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { generateToken, generatePortalToken } from '@/lib/tokens'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import type {
  WorkspaceTemplate,
  WorkspaceTemplateAssignmentSpec,
  WorkspaceTemplateResourceSpec,
  SubscriptionTier,
} from '@/types/database'
import { unfurlUrl } from '@/lib/og-unfurl'

// ============================================================================
// TEMPLATE CRUD ACTIONS
// ============================================================================

export async function getTemplates() {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated', data: [] as WorkspaceTemplate[] }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspace_templates')
    .select('*')
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message, data: [] as WorkspaceTemplate[] }
  return { data: (data || []) as WorkspaceTemplate[] }
}

export async function createTemplate(data: {
  name: string
  description?: string
  assignmentSpecs: WorkspaceTemplateAssignmentSpec[]
  resourceSpecs: WorkspaceTemplateResourceSpec[]
  defaultExpiresInDays?: number
}) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Tier limit check
  const { count } = await supabase
    .from('workspace_templates')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .is('deleted_at', null)

  const limit = TIER_LIMITS[tier].maxWorkspaceTemplates
  if (count !== null && count >= limit) {
    return {
      error: limit === 0
        ? 'Workspace templates require a paid plan. Upgrade to get started.'
        : `Your plan allows up to ${limit} template${limit !== 1 ? 's' : ''}. Upgrade for more.`,
      limitReached: true,
    }
  }

  // Validate name
  const name = data.name.trim()
  if (!name) return { error: 'Template name is required' }
  if (name.length > 100) return { error: 'Template name must be 100 characters or less' }

  // Validate resource URLs
  for (const spec of data.resourceSpecs) {
    if (!spec.url) return { error: 'Each resource must have a URL' }
    try {
      new URL(spec.url)
    } catch {
      return { error: `Invalid URL: ${spec.url}` }
    }
  }

  const { data: template, error } = await supabase
    .from('workspace_templates')
    .insert({
      therapist_id: user.id,
      name,
      description: data.description?.trim() || null,
      assignment_specs: data.assignmentSpecs,
      resource_specs: data.resourceSpecs,
      default_expires_in_days: data.defaultExpiresInDays || 7,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'workspace_template',
    entity_id: (template as WorkspaceTemplate).id,
    metadata: {
      name,
      assignment_count: data.assignmentSpecs.length,
      resource_count: data.resourceSpecs.length,
    },
  })

  revalidatePath('/templates')
  return { data: template as WorkspaceTemplate }
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string
    description?: string | null
    assignmentSpecs?: WorkspaceTemplateAssignmentSpec[]
    resourceSpecs?: WorkspaceTemplateResourceSpec[]
    defaultExpiresInDays?: number
  }
) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('workspace_templates')
    .select('id')
    .eq('id', id)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Template not found' }

  // Validate name if provided
  if (data.name !== undefined) {
    const name = data.name.trim()
    if (!name) return { error: 'Template name is required' }
    if (name.length > 100) return { error: 'Template name must be 100 characters or less' }
  }

  // Validate resource URLs if provided
  if (data.resourceSpecs) {
    for (const spec of data.resourceSpecs) {
      if (!spec.url) return { error: 'Each resource must have a URL' }
      try {
        new URL(spec.url)
      } catch {
        return { error: `Invalid URL: ${spec.url}` }
      }
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.assignmentSpecs !== undefined) updateData.assignment_specs = data.assignmentSpecs
  if (data.resourceSpecs !== undefined) updateData.resource_specs = data.resourceSpecs
  if (data.defaultExpiresInDays !== undefined) updateData.default_expires_in_days = data.defaultExpiresInDays

  const { error } = await supabase
    .from('workspace_templates')
    .update(updateData)
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'workspace_template',
    entity_id: id,
    metadata: { fields_updated: Object.keys(updateData).filter((k) => k !== 'updated_at') },
  })

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('workspace_templates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'delete',
    entity_type: 'workspace_template',
    entity_id: id,
  })

  revalidatePath('/templates')
  return { success: true }
}

// ============================================================================
// APPLY TEMPLATE
// ============================================================================

export async function applyTemplate(templateId: string, relationshipId: string) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Fetch template
  const { data: template } = await supabase
    .from('workspace_templates')
    .select('*')
    .eq('id', templateId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!template) return { error: 'Template not found' }
  const typedTemplate = template as WorkspaceTemplate

  // Fetch relationship
  const { data: rel } = await supabase
    .from('therapeutic_relationships')
    .select('id, relationship_type, client_portal_token')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!rel) return { error: 'Client not found' }
  if (rel.relationship_type !== 'clinical') {
    return { error: 'Cannot apply templates to supervision relationships.' }
  }

  const assignmentSpecs = typedTemplate.assignment_specs as WorkspaceTemplateAssignmentSpec[]
  const resourceSpecs = typedTemplate.resource_specs as WorkspaceTemplateResourceSpec[]

  if (assignmentSpecs.length === 0 && resourceSpecs.length === 0) {
    return { error: 'This template has no worksheets or resources to apply.' }
  }

  // Validate worksheets still exist — filter to available ones
  const worksheetIds = assignmentSpecs.map((s) => s.worksheet_id)
  let availableWorksheetIds = new Set<string>()
  if (worksheetIds.length > 0) {
    const { data: validWorksheets } = await supabase
      .from('worksheets')
      .select('id')
      .in('id', worksheetIds)
      .or(`and(is_published.eq.true,is_curated.eq.true),and(created_by.eq.${user.id},is_curated.eq.false)`)
      .is('deleted_at', null)

    availableWorksheetIds = new Set((validWorksheets || []).map((w) => w.id))
  }

  const validSpecs = assignmentSpecs.filter((s) => availableWorksheetIds.has(s.worksheet_id))
  const skippedSpecs = assignmentSpecs.filter((s) => !availableWorksheetIds.has(s.worksheet_id))

  // Tier limit check — active assignments (all-or-nothing)
  const { count: currentActiveCount } = await supabase
    .from('worksheet_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .is('deleted_at', null)

  const assignmentLimit = TIER_LIMITS[tier].maxActiveAssignments
  if (
    assignmentLimit !== Infinity &&
    currentActiveCount !== null &&
    currentActiveCount + validSpecs.length > assignmentLimit
  ) {
    const remaining = Math.max(0, assignmentLimit - currentActiveCount)
    return {
      error: `This template would create ${validSpecs.length} assignment${validSpecs.length !== 1 ? 's' : ''}, but you only have ${remaining} slot${remaining !== 1 ? 's' : ''} remaining. Upgrade your plan or reduce active assignments.`,
      limitReached: true,
    }
  }

  // Tier limit check — shared resources per client
  const { count: currentResourceCount } = await supabase
    .from('shared_resources')
    .select('*', { count: 'exact', head: true })
    .eq('relationship_id', relationshipId)
    .eq('status', 'active')
    .is('deleted_at', null)

  const resourceLimit = TIER_LIMITS[tier].maxSharedResourcesPerClient
  if (
    resourceLimit !== Infinity &&
    currentResourceCount !== null &&
    currentResourceCount + resourceSpecs.length > resourceLimit
  ) {
    const remaining = Math.max(0, resourceLimit - currentResourceCount)
    return {
      error: `This template would share ${resourceSpecs.length} resource${resourceSpecs.length !== 1 ? 's' : ''}, but you only have ${remaining} slot${remaining !== 1 ? 's' : ''} remaining for this client.`,
      limitReached: true,
    }
  }

  // Create assignments
  let assignmentsCreated = 0
  for (const spec of validSpecs) {
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(
      expiresAt.getDate() + (spec.expires_in_days ?? typedTemplate.default_expires_in_days)
    )

    const { error: insertError } = await supabase
      .from('worksheet_assignments')
      .insert({
        worksheet_id: spec.worksheet_id,
        therapist_id: user.id,
        relationship_id: relationshipId,
        token,
        status: 'assigned',
        expires_at: expiresAt.toISOString(),
      })

    if (!insertError) {
      assignmentsCreated++
    }
  }

  // Share resources
  let resourcesCreated = 0
  for (const spec of resourceSpecs) {
    const { data: resource, error: insertError } = await supabase
      .from('shared_resources')
      .insert({
        relationship_id: relationshipId,
        therapist_id: user.id,
        resource_type: 'link',
        title: spec.title.trim(),
        therapist_note: spec.note?.trim() || null,
        url: spec.url,
      })
      .select('id')
      .single()

    if (!insertError && resource) {
      resourcesCreated++
      // Fire-and-forget OG unfurling
      unfurlUrl(spec.url)
        .then(async (ogData) => {
          const innerSupabase = await createClient()
          await innerSupabase
            .from('shared_resources')
            .update({
              ...ogData,
              og_fetched_at: new Date().toISOString(),
            })
            .eq('id', resource.id)
        })
        .catch(() => {})
    }
  }

  // Lazy-generate portal token if needed
  if (!rel.client_portal_token) {
    await supabase
      .from('therapeutic_relationships')
      .update({ client_portal_token: generatePortalToken() })
      .eq('id', relationshipId)
  }

  // Update template stats
  await supabase
    .from('workspace_templates')
    .update({
      times_applied: typedTemplate.times_applied + 1,
      last_applied_at: new Date().toISOString(),
    })
    .eq('id', templateId)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'workspace_template_application',
    entity_id: templateId,
    metadata: {
      relationship_id: relationshipId,
      assignments_created: assignmentsCreated,
      resources_created: resourcesCreated,
      skipped_worksheets: skippedSpecs.length,
    },
  })

  revalidatePath(`/clients/${relationshipId}`)
  revalidatePath('/templates')
  return {
    success: true,
    created: {
      assignments: assignmentsCreated,
      resources: resourcesCreated,
    },
    skipped: skippedSpecs.map((s) => s.worksheet_id),
  }
}

// ============================================================================
// SAVE AS TEMPLATE
// ============================================================================

export async function saveAsTemplate(
  relationshipId: string,
  name: string,
  description?: string
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier

  // Tier limit check
  const { count } = await supabase
    .from('workspace_templates')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .is('deleted_at', null)

  const limit = TIER_LIMITS[tier].maxWorkspaceTemplates
  if (count !== null && count >= limit) {
    return {
      error: limit === 0
        ? 'Workspace templates require a paid plan.'
        : `Your plan allows up to ${limit} template${limit !== 1 ? 's' : ''}. Upgrade for more.`,
      limitReached: true,
    }
  }

  // Validate name
  const trimmedName = name.trim()
  if (!trimmedName) return { error: 'Template name is required' }
  if (trimmedName.length > 100) return { error: 'Template name must be 100 characters or less' }

  // Fetch active assignments for this relationship
  const { data: assignments } = await supabase
    .from('worksheet_assignments')
    .select('worksheet_id')
    .eq('relationship_id', relationshipId)
    .eq('therapist_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .is('deleted_at', null)

  // Fetch active shared resources
  const { data: resources } = await supabase
    .from('shared_resources')
    .select('title, url, therapist_note')
    .eq('relationship_id', relationshipId)
    .eq('therapist_id', user.id)
    .eq('status', 'active')
    .is('deleted_at', null)

  const assignmentSpecs: WorkspaceTemplateAssignmentSpec[] = (assignments || []).map((a) => ({
    worksheet_id: a.worksheet_id,
  }))

  const resourceSpecs: WorkspaceTemplateResourceSpec[] = (resources || []).map((r) => ({
    title: r.title,
    url: r.url,
    note: r.therapist_note || undefined,
  }))

  const { data: template, error } = await supabase
    .from('workspace_templates')
    .insert({
      therapist_id: user.id,
      name: trimmedName,
      description: description?.trim() || null,
      assignment_specs: assignmentSpecs,
      resource_specs: resourceSpecs,
      default_expires_in_days: 7,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'workspace_template',
    entity_id: (template as WorkspaceTemplate).id,
    metadata: {
      name: trimmedName,
      source: 'save_from_client',
      relationship_id: relationshipId,
      assignment_count: assignmentSpecs.length,
      resource_count: resourceSpecs.length,
    },
  })

  revalidatePath('/templates')
  return { data: template as WorkspaceTemplate }
}
