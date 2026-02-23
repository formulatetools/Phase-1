'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import type { FeatureRequest, FeatureRequestCategory } from '@/types/database'

const VALID_CATEGORIES: FeatureRequestCategory[] = [
  'new_worksheet_or_tool',
  'new_psychometric_measure',
  'platform_feature',
  'integration',
  'other',
]

const VALID_STATUSES = ['submitted', 'under_review', 'planned', 'shipped', 'declined']
const MAX_REQUESTS_PER_DAY = 5

// ── Submit a feature request ───────────────────────────────────────────────
export async function submitFeatureRequest(
  category: FeatureRequestCategory,
  title: string,
  description: string,
  currentTool: string
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }

  // Validation
  if (!title.trim()) return { error: 'Title is required' }
  if (title.trim().length > 100) return { error: 'Title must be 100 characters or fewer' }
  if (!VALID_CATEGORIES.includes(category)) return { error: 'Invalid category' }

  const supabase = await createClient()

  // Rate limit: max 5 per day
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('feature_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', twentyFourHoursAgo)

  if (count !== null && count >= MAX_REQUESTS_PER_DAY) {
    return { error: 'You can submit up to 5 requests per day. Please try again tomorrow.' }
  }

  // Insert
  const { data, error } = await supabase
    .from('feature_requests')
    .insert({
      user_id: user.id,
      category,
      title: title.trim(),
      description: description.trim() || null,
      current_tool: currentTool.trim() || null,
      status: 'submitted',
    } as Record<string, unknown>)
    .select()
    .single()

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'feature_request',
    entity_id: (data as FeatureRequest).id,
    metadata: { title: title.trim(), category },
  } as Record<string, unknown>)

  revalidatePath('/feature-requests')
  return { id: (data as FeatureRequest).id }
}

// ── Toggle upvote on a feature request ─────────────────────────────────────
export async function toggleVote(featureRequestId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Check existing vote
  const { data: existingVote } = await supabase
    .from('feature_request_votes')
    .select('id')
    .eq('feature_request_id', featureRequestId)
    .eq('user_id', user.id)
    .single()

  if (existingVote) {
    // Remove vote
    const { error } = await supabase
      .from('feature_request_votes')
      .delete()
      .eq('id', (existingVote as { id: string }).id)

    if (error) return { error: error.message }

    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'remove_upvote',
      entity_type: 'feature_request',
      entity_id: featureRequestId,
      metadata: null,
    } as Record<string, unknown>)

    revalidatePath('/feature-requests')
    return { voted: false }
  } else {
    // Add vote
    const { error } = await supabase
      .from('feature_request_votes')
      .insert({
        feature_request_id: featureRequestId,
        user_id: user.id,
      } as Record<string, unknown>)

    if (error) return { error: error.message }

    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'upvote',
      entity_type: 'feature_request',
      entity_id: featureRequestId,
      metadata: null,
    } as Record<string, unknown>)

    revalidatePath('/feature-requests')
    return { voted: true }
  }
}

// ── Admin: update status and notes ─────────────────────────────────────────
export async function updateFeatureRequestStatus(
  featureRequestId: string,
  status: string,
  adminNotes: string
) {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) return { error: 'Not authenticated' }
  if (profile.role !== 'admin') return { error: 'Unauthorized' }
  if (!VALID_STATUSES.includes(status)) return { error: 'Invalid status' }

  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {
    status,
    admin_notes: adminNotes.trim() || null,
  }

  // Set shipped_at when transitioning to shipped
  if (status === 'shipped') {
    updatePayload.shipped_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('feature_requests')
    .update(updatePayload)
    .eq('id', featureRequestId)

  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'feature_request',
    entity_id: featureRequestId,
    metadata: { new_status: status },
  } as Record<string, unknown>)

  revalidatePath('/feature-requests')
  revalidatePath('/admin/feature-requests')
  return { success: true }
}
