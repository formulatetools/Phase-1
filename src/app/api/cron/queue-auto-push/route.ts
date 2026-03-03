import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/utils/verify-cron-secret'
import { pushNextItemInternal } from '@/lib/queue/push-item'
import type { PlanQueue } from '@/types/database'

/**
 * Queue auto-push cron — pushes the next queued item for plan queues
 * that have time-based auto-push enabled and are past their scheduled push time.
 *
 * Schedule: daily at 09:00 UTC (via Vercel Cron)
 * Endpoint: GET /api/cron/queue-auto-push
 */

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Find queues where next_auto_push_at <= now and status = 'active'
  const { data: queues } = await supabase
    .from('plan_queues')
    .select('*')
    .eq('status', 'active')
    .lte('next_auto_push_at', now)
    .is('deleted_at', null)

  if (!queues || queues.length === 0) {
    return NextResponse.json({ ok: true, pushed: 0, candidates: 0 })
  }

  let pushed = 0

  for (const queue of queues) {
    const typedQueue = queue as PlanQueue

    // Only push for time-based or both modes
    if (typedQueue.push_mode !== 'time_based' && typedQueue.push_mode !== 'both') {
      continue
    }

    try {
      const result = await pushNextItemInternal(supabase, typedQueue)
      if (result) {
        pushed++

        // Audit log
        await supabase.from('audit_log').insert({
          user_id: typedQueue.therapist_id,
          action: 'create',
          entity_type: 'queue_auto_push',
          entity_id: typedQueue.id,
          metadata: {
            item_id: result.item.id,
            item_type: result.item.item_type,
            push_mode: typedQueue.push_mode,
          },
        })
      }
    } catch (err) {
      console.error(`Failed to auto-push queue ${typedQueue.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, pushed, candidates: queues.length })
}
