'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

/**
 * Subscribe to real-time changes on `worksheet_assignments` for a given
 * therapist. When a client submits or updates homework, this hook shows
 * a toast and calls `router.refresh()` so server components re-fetch.
 *
 * Prerequisites:
 * - Supabase Realtime must be enabled on the `worksheet_assignments` table.
 *   Run: ALTER PUBLICATION supabase_realtime ADD TABLE worksheet_assignments;
 */
export function useRealtimeAssignments(therapistId: string) {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`assignments:${therapistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worksheet_assignments',
          filter: `therapist_id=eq.${therapistId}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>)?.status as string | undefined
          const oldStatus = (payload.old as Record<string, unknown>)?.status as string | undefined

          // Only notify on meaningful status transitions
          if (payload.eventType === 'UPDATE' && newStatus !== oldStatus) {
            const messages: Record<string, string> = {
              in_progress: 'A client has started their homework',
              completed: 'A client has completed their homework',
            }
            const message = newStatus ? messages[newStatus] : null

            if (message) {
              toast({ type: 'info', message })
            }
          }

          if (payload.eventType === 'INSERT') {
            // New assignment created (could be from another device/session)
            toast({ type: 'info', message: 'New homework assignment created' })
          }

          // Re-fetch server data so the page reflects the latest state
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [therapistId, router, toast])
}
