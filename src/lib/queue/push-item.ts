import { generateToken, generatePortalToken } from '@/lib/tokens'
import { unfurlUrl } from '@/lib/og-unfurl'
import type { PlanQueue, PlanQueueItem } from '@/types/database'

type SupabaseClient = ReturnType<typeof import('@/lib/supabase/service').createServiceClient>

/**
 * Push the next queued item in a plan queue.
 * Shared logic used by:
 *   - queue-actions.ts (manual push via server action)
 *   - completion-trigger.ts (auto-push on homework completion)
 *   - queue-auto-push cron (time-based auto-push)
 *
 * Returns the pushed item or null if nothing to push.
 */
export async function pushNextItemInternal(
  supabase: SupabaseClient,
  queue: PlanQueue,
): Promise<{ item: PlanQueueItem; assignmentId?: string; resourceId?: string } | null> {
  // Find next queued item by position
  const { data: nextItem } = await supabase
    .from('plan_queue_items')
    .select('*')
    .eq('queue_id', queue.id)
    .eq('status', 'queued')
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (!nextItem) {
    // No more items — mark queue as completed
    await supabase
      .from('plan_queues')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', queue.id)
    return null
  }

  const item = nextItem as PlanQueueItem
  const now = new Date().toISOString()

  // Ensure relationship has a portal token
  const { data: rel } = await supabase
    .from('therapeutic_relationships')
    .select('client_portal_token')
    .eq('id', queue.relationship_id)
    .single()

  if (rel && !rel.client_portal_token) {
    await supabase
      .from('therapeutic_relationships')
      .update({ client_portal_token: generatePortalToken() })
      .eq('id', queue.relationship_id)
  }

  let assignmentId: string | undefined
  let resourceId: string | undefined

  if (item.item_type === 'worksheet' && item.worksheet_id) {
    // Create worksheet assignment
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (item.expires_in_days || 7))

    const { data: assignment, error } = await supabase
      .from('worksheet_assignments')
      .insert({
        worksheet_id: item.worksheet_id,
        therapist_id: queue.therapist_id,
        relationship_id: queue.relationship_id,
        token,
        status: 'assigned',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create assignment from queue:', error)
      return null
    }

    assignmentId = assignment.id

    // Update queue item with link to created assignment
    await supabase
      .from('plan_queue_items')
      .update({ status: 'pushed', pushed_at: now, assignment_id: assignment.id })
      .eq('id', item.id)

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: queue.therapist_id,
      action: 'assign',
      entity_type: 'worksheet_assignment',
      entity_id: assignment.id,
      metadata: {
        worksheet_id: item.worksheet_id,
        relationship_id: queue.relationship_id,
        source: 'queue_push',
        queue_id: queue.id,
      },
    })
  } else if (item.item_type === 'resource' && item.resource_url) {
    // Create shared resource
    const { data: resource, error } = await supabase
      .from('shared_resources')
      .insert({
        relationship_id: queue.relationship_id,
        therapist_id: queue.therapist_id,
        resource_type: 'link',
        title: (item.resource_title || 'Resource').trim(),
        therapist_note: item.resource_note?.trim() || null,
        url: item.resource_url,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create resource from queue:', error)
      return null
    }

    resourceId = resource.id

    // Update queue item with link to created resource
    await supabase
      .from('plan_queue_items')
      .update({ status: 'pushed', pushed_at: now, shared_resource_id: resource.id })
      .eq('id', item.id)

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: queue.therapist_id,
      action: 'share_resource',
      entity_type: 'shared_resource',
      entity_id: resource.id,
      metadata: {
        resource_type: 'link',
        relationship_id: queue.relationship_id,
        source: 'queue_push',
        queue_id: queue.id,
        url: item.resource_url,
      },
    })

    // Fire-and-forget OG unfurling
    unfurlUrl(item.resource_url)
      .then(async (ogData) => {
        await supabase
          .from('shared_resources')
          .update({ ...ogData, og_fetched_at: new Date().toISOString() })
          .eq('id', resource.id)
      })
      .catch(() => {})
  }

  // Update queue timestamps + compute next_auto_push_at
  const queueUpdate: Record<string, unknown> = {
    last_pushed_at: now,
    updated_at: now,
  }

  // Check if there are more items
  const { count: remainingCount } = await supabase
    .from('plan_queue_items')
    .select('*', { count: 'exact', head: true })
    .eq('queue_id', queue.id)
    .eq('status', 'queued')

  if (remainingCount === 0) {
    queueUpdate.status = 'completed'
    queueUpdate.next_auto_push_at = null
  } else if (queue.push_mode === 'time_based' || queue.push_mode === 'both') {
    const nextPush = new Date()
    nextPush.setDate(nextPush.getDate() + queue.auto_push_interval_days)
    queueUpdate.next_auto_push_at = nextPush.toISOString()
  } else {
    queueUpdate.next_auto_push_at = null
  }

  await supabase
    .from('plan_queues')
    .update(queueUpdate)
    .eq('id', queue.id)

  return { item, assignmentId, resourceId }
}

/**
 * Compute the next_auto_push_at timestamp for a queue.
 */
export function computeNextAutoPush(
  pushMode: PlanQueue['push_mode'],
  intervalDays: number,
  fromDate: Date = new Date()
): string | null {
  if (pushMode === 'time_based' || pushMode === 'both') {
    const next = new Date(fromDate)
    next.setDate(next.getDate() + intervalDays)
    return next.toISOString()
  }
  return null
}
