/**
 * Shared activity feed helpers — used by both the therapist dashboard
 * and the admin dashboard so we don't duplicate icon/label/time logic.
 */

export interface ActivityItem {
  action: string
  entity_type: string
  metadata: Record<string, unknown> | null
  created_at: string
}

/** Human-readable label for an audit-log entry */
export function activityLabel(item: ActivityItem): string {
  const meta = item.metadata || {}
  switch (item.action) {
    case 'create':
      if (item.entity_type === 'therapeutic_relationship')
        return `Added client "${meta.client_label || 'Unknown'}"`
      return `Created ${item.entity_type.replace(/_/g, ' ')}`
    case 'assign':
      return 'Assigned homework'
    case 'read':
      if (meta.action === 'marked_as_reviewed') return 'Reviewed homework submission'
      return 'Viewed record'
    case 'export':
      return 'Exported worksheet'
    case 'gdpr_erasure':
      return `Erased client data (${meta.responses_deleted ?? 0} responses)`
    case 'login':
      return 'Signed in'
    case 'logout':
      return 'Signed out'
    default:
      return item.action.replace(/_/g, ' ')
  }
}

/** Coloured icon circle for an audit action */
export function activityIcon(action: string) {
  switch (action) {
    case 'create':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      )
    case 'assign':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light">
          <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </div>
      )
    case 'read':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )
    case 'export':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50">
          <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
      )
    case 'gdpr_erasure':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
      )
    case 'login':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
          <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
  }
}

/** Relative time label (e.g. "5m ago", "2h ago", "3d ago") */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
