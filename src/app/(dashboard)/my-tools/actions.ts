'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { validateCustomSchema } from '@/lib/validation/custom-worksheet'
import { revalidatePath } from 'next/cache'
import type { SubscriptionTier } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'

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

  const { data: forked, error } = await supabase
    .from('worksheets')
    .insert({
      title: `${typedSource.title} (Custom)`,
      slug: `custom-temp-${Date.now()}`,
      description: typedSource.description,
      instructions: typedSource.instructions,
      schema: typedSource.schema,
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
