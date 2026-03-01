'use client'

import Link from 'next/link'

interface PortalAssignment {
  id: string
  token: string
  status: string
  worksheet_id: string
  assigned_at: string
  due_date: string | null
  expires_at: string
  completed_at: string | null
}

interface PortalWorksheet {
  id: string
  title: string
}

interface AssignmentCardProps {
  assignment: PortalAssignment
  worksheet: PortalWorksheet | undefined
  portalToken: string
  appUrl: string
  variant: 'current' | 'completed'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function AssignmentCard({
  assignment,
  worksheet,
  portalToken,
  appUrl,
  variant,
}: AssignmentCardProps) {
  const title = worksheet?.title || 'Worksheet'

  const isExpired = new Date(assignment.expires_at) < new Date()
  const isCurrent = variant === 'current'

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm transition-colors hover:border-primary-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <p className="font-medium text-primary-800 truncate">{title}</p>

          {/* Date line */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-primary-400">
            <span>Assigned {formatDate(assignment.assigned_at)}</span>
            {assignment.due_date && (
              <span>Due {formatDate(assignment.due_date)}</span>
            )}
            {assignment.completed_at && variant === 'completed' && (
              <span>
                Completed {formatDate(assignment.completed_at)}
              </span>
            )}
          </div>

          {/* Status badge */}
          <div className="mt-2">
            {assignment.status === 'assigned' && !isExpired && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary-300" aria-hidden="true" />
                Not started
              </span>
            )}
            {assignment.status === 'assigned' && isExpired && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary-200" aria-hidden="true" />
                Expired
              </span>
            )}
            {assignment.status === 'in_progress' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 1 A5 5 0 0 1 11 6" fill="currentColor" />
                </svg>
                In progress
              </span>
            )}
            {(assignment.status === 'completed' || assignment.status === 'reviewed') && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {isCurrent && assignment.status === 'assigned' && !isExpired && (
            <a
              href={`${appUrl}/hw/${assignment.token}`}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
            >
              Open
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          )}
          {isCurrent && assignment.status === 'in_progress' && !isExpired && (
            <a
              href={`${appUrl}/hw/${assignment.token}`}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
            >
              Continue
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          )}
          {variant === 'completed' && (
            <Link
              href={`/client/${portalToken}/response/${assignment.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
            >
              View my responses
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
