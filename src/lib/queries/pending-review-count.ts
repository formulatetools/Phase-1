import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the count of homework assignments awaiting therapist review.
 * Wrapped in React `cache()` so multiple calls within the same
 * server render (e.g. layout + page) only hit Supabase once.
 */
export const getPendingReviewCount = cache(async (therapistId: string): Promise<number> => {
  const supabase = await createClient()
  const { count } = await supabase
    .from('worksheet_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', therapistId)
    .eq('status', 'completed')
    .is('deleted_at', null)

  return count ?? 0
})
