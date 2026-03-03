'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import { pushNextItemInternal, computeNextAutoPush } from '@/lib/queue/push-item'
import type {
  PlanQueue,
  PlanQueueItem,
  PlanQueuePushMode,
  QueueItemType,
} from '@/types/database'

// ============================================================================
// CREATE QUEUE
// ============================================================================

interface QueueItemInput {
  item_type: QueueItemType
  worksheet_id?: string
  expires_in_days?: number
  resource_title?: string
  resource_url?: string
  resource_note?: string
}

export async function createQueue(
  relationshipId: string,
  data: {
    templateId?: string
    name: string
    pushMode: PlanQueuePushMode
    intervalDays: number
    items: QueueItemInput[]
    pushFirstImmediately: boolean
  }
) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership + clinical relationship
  const { data: rel } = await supabase
    .from('therapeutic_relationships')
    .select('id, relationship_type')
    .eq('id', relationshipId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!rel) return { error: 'Client not found' }
  if (rel.relationship_type !== 'clinical') {
    return { error: 'Cannot create homework queues for supervision relationships.' }
  }

  if (data.items.length === 0) {
    return { error: 'Queue must have at least one item.' }
  }

  // Validate template exists if provided
  if (data.templateId) {
    const { data: template } = await supabase
      .from('workspace_templates')
      .select('id')
      .eq('id', data.templateId)
      .eq('therapist_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!template) return { error: 'Homework plan not found' }
  }

  // Create the queue
  const nextAutoPush = data.pushFirstImmediately
    ? computeNextAutoPush(data.pushMode, data.intervalDays)
    : computeNextAutoPush(data.pushMode, data.intervalDays)

  const { data: queue, error: queueError } = await supabase
    .from('plan_queues')
    .insert({
      relationship_id: relationshipId,
      therapist_id: user.id,
      template_id: data.templateId || null,
      name: data.name.trim(),
      push_mode: data.pushMode,
      auto_push_interval_days: data.intervalDays,
      next_auto_push_at: nextAutoPush,
    })
    .select()
    .single()

  if (queueError) return { error: queueError.message }
  const typedQueue = queue as PlanQueue

  // Create queue items
  const itemInserts = data.items.map((item, index) => ({
    queue_id: typedQueue.id,
    item_type: item.item_type,
    worksheet_id: item.item_type === 'worksheet' ? item.worksheet_id : null,
    expires_in_days: item.expires_in_days || 7,
    resource_title: item.item_type === 'resource' ? item.resource_title : null,
    resource_url: item.item_type === 'resource' ? item.resource_url : null,
    resource_note: item.item_type === 'resource' ? item.resource_note : null,
    position: index,
  }))

  const { error: itemsError } = await supabase
    .from('plan_queue_items')
    .insert(itemInserts)

  if (itemsError) return { error: itemsError.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'plan_queue',
    entity_id: typedQueue.id,
    metadata: {
      relationship_id: relationshipId,
      template_id: data.templateId,
      item_count: data.items.length,
      push_mode: data.pushMode,
    },
  })

  // Optionally push first item immediately
  let firstPush = null
  if (data.pushFirstImmediately) {
    // Re-fetch queue with items for push logic
    firstPush = await pushNextItemInternal(supabase as never, typedQueue)
  }

  // Update template stats if from a template
  if (data.templateId) {
    const { data: tpl } = await supabase
      .from('workspace_templates')
      .select('times_applied')
      .eq('id', data.templateId)
      .single()

    if (tpl) {
      await supabase
        .from('workspace_templates')
        .update({
          times_applied: (tpl.times_applied as number) + 1,
          last_applied_at: new Date().toISOString(),
        })
        .eq('id', data.templateId)
    }
  }

  revalidatePath(`/clients/${relationshipId}`)
  return { data: typedQueue, firstPush }
}

// ============================================================================
// PUSH NEXT ITEM
// ============================================================================

export async function pushNextItem(queueId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership
  const { data: queue } = await supabase
    .from('plan_queues')
    .select('*')
    .eq('id', queueId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!queue) return { error: 'Queue not found' }
  const typedQueue = queue as PlanQueue

  if (typedQueue.status !== 'active') {
    return { error: 'Queue is not active' }
  }

  const result = await pushNextItemInternal(supabase as never, typedQueue)

  if (!result) {
    return { error: 'No more items to push' }
  }

  revalidatePath(`/clients/${typedQueue.relationship_id}`)
  return { success: true, item: result.item }
}

// ============================================================================
// SKIP ITEM
// ============================================================================

export async function skipItem(itemId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership through queue
  const { data: item } = await supabase
    .from('plan_queue_items')
    .select('*, plan_queues!inner(therapist_id, relationship_id)')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Item not found' }

  const queueData = (item as Record<string, unknown>).plan_queues as { therapist_id: string; relationship_id: string }
  if (queueData.therapist_id !== user.id) return { error: 'Not authorized' }

  if ((item as PlanQueueItem).status !== 'queued') {
    return { error: 'Can only skip queued items' }
  }

  await supabase
    .from('plan_queue_items')
    .update({ status: 'skipped' })
    .eq('id', itemId)

  revalidatePath(`/clients/${queueData.relationship_id}`)
  return { success: true }
}

// ============================================================================
// REORDER ITEMS
// ============================================================================

export async function reorderItems(queueId: string, itemIds: string[]) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify ownership
  const { data: queue } = await supabase
    .from('plan_queues')
    .select('therapist_id, relationship_id')
    .eq('id', queueId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!queue) return { error: 'Queue not found' }

  // Update positions
  for (let i = 0; i < itemIds.length; i++) {
    await supabase
      .from('plan_queue_items')
      .update({ position: i })
      .eq('id', itemIds[i])
      .eq('queue_id', queueId)
  }

  revalidatePath(`/clients/${queue.relationship_id}`)
  return { success: true }
}

// ============================================================================
// UPDATE QUEUE SETTINGS
// ============================================================================

export async function updateQueueSettings(
  queueId: string,
  settings: {
    pushMode?: PlanQueuePushMode
    intervalDays?: number
  }
) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('plan_queues')
    .select('*')
    .eq('id', queueId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!queue) return { error: 'Queue not found' }
  const typedQueue = queue as PlanQueue

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (settings.pushMode !== undefined) updates.push_mode = settings.pushMode
  if (settings.intervalDays !== undefined) updates.auto_push_interval_days = settings.intervalDays

  // Recompute next_auto_push_at
  const newPushMode = (settings.pushMode ?? typedQueue.push_mode) as PlanQueuePushMode
  const newInterval = settings.intervalDays ?? typedQueue.auto_push_interval_days
  const fromDate = typedQueue.last_pushed_at ? new Date(typedQueue.last_pushed_at) : new Date()
  updates.next_auto_push_at = computeNextAutoPush(newPushMode, newInterval, fromDate)

  await supabase
    .from('plan_queues')
    .update(updates)
    .eq('id', queueId)

  revalidatePath(`/clients/${typedQueue.relationship_id}`)
  return { success: true }
}

// ============================================================================
// PAUSE / RESUME QUEUE
// ============================================================================

export async function pauseQueue(queueId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('plan_queues')
    .select('relationship_id')
    .eq('id', queueId)
    .eq('therapist_id', user.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()

  if (!queue) return { error: 'Queue not found or already paused' }

  await supabase
    .from('plan_queues')
    .update({ status: 'paused', next_auto_push_at: null, updated_at: new Date().toISOString() })
    .eq('id', queueId)

  revalidatePath(`/clients/${queue.relationship_id}`)
  return { success: true }
}

export async function resumeQueue(queueId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('plan_queues')
    .select('*')
    .eq('id', queueId)
    .eq('therapist_id', user.id)
    .eq('status', 'paused')
    .is('deleted_at', null)
    .single()

  if (!queue) return { error: 'Queue not found or not paused' }
  const typedQueue = queue as PlanQueue

  const nextAutoPush = computeNextAutoPush(
    typedQueue.push_mode,
    typedQueue.auto_push_interval_days,
    typedQueue.last_pushed_at ? new Date(typedQueue.last_pushed_at) : new Date()
  )

  await supabase
    .from('plan_queues')
    .update({ status: 'active', next_auto_push_at: nextAutoPush, updated_at: new Date().toISOString() })
    .eq('id', queueId)

  revalidatePath(`/clients/${typedQueue.relationship_id}`)
  return { success: true }
}

// ============================================================================
// DELETE QUEUE
// ============================================================================

export async function deleteQueue(queueId: string) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('plan_queues')
    .select('relationship_id')
    .eq('id', queueId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!queue) return { error: 'Queue not found' }

  await supabase
    .from('plan_queues')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', queueId)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'delete',
    entity_type: 'plan_queue',
    entity_id: queueId,
  })

  revalidatePath(`/clients/${queue.relationship_id}`)
  return { success: true }
}
