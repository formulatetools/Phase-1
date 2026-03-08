'use client'

import { useRealtimeAssignments } from '@/hooks/use-realtime-assignments'

interface RealtimeWrapperProps {
  therapistId: string
  children: React.ReactNode
}

/**
 * Thin client wrapper that activates real-time homework updates
 * for the therapist's assignment data. Wrap any server component
 * page content that should auto-refresh on homework changes.
 */
export function RealtimeWrapper({ therapistId, children }: RealtimeWrapperProps) {
  useRealtimeAssignments(therapistId)
  return <>{children}</>
}
