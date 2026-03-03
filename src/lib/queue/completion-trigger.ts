import { pushNextItemInternal } from '@/lib/queue/push-item'
import type { PlanQueue } from '@/types/database'

type SupabaseClient = ReturnType<typeof import('@/lib/supabase/service').createServiceClient>

/**
 * After a homework assignment is completed (submitted), check if it was
 * pushed from a plan queue with completion-based auto-push enabled.
 * If so, push the next queued item automatically.
 */
export async function triggerCompletionPush(
  supabase: SupabaseClient,
  assignment: { id: string }
) {
  // 1. Find the queue item linked to this assignment
  const { data: item } = await supabase
    .from('plan_queue_items')
    .select('queue_id')
    .eq('assignment_id', assignment.id)
    .eq('status', 'pushed')
    .single()

  if (!item) return // Not from a queue

  // 2. Check if queue has completion-based push enabled
  const { data: queue } = await supabase
    .from('plan_queues')
    .select('*')
    .eq('id', item.queue_id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()

  if (!queue) return
  const typedQueue = queue as PlanQueue

  if (typedQueue.push_mode !== 'completion_based' && typedQueue.push_mode !== 'both') {
    return
  }

  // 3. Push the next queued item
  await pushNextItemInternal(supabase, typedQueue)
}
