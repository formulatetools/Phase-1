'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { WorksheetSchema } from '@/types/worksheet'
// pdf-lib loaded dynamically on demand (~500KB)

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
  schema?: WorksheetSchema
  responseData?: Record<string, unknown> | null
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  // Include year if the date is not in the current year
  if (date.getFullYear() !== now.getFullYear()) {
    opts.year = 'numeric'
  }
  return date.toLocaleDateString('en-GB', opts)
}

export function AssignmentCard({
  assignment,
  worksheet,
  portalToken,
  appUrl,
  variant,
  schema,
  responseData,
}: AssignmentCardProps) {
  const title = worksheet?.title || 'Worksheet'
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  const isExpired = new Date(assignment.expires_at) < new Date()
  const isCurrent = variant === 'current'

  const handleDownloadPdf = async () => {
    if (!schema) return
    setDownloading(true)
    try {
      const { downloadFillablePdf } = await import('@/lib/utils/fillable-pdf')
      await downloadFillablePdf({
        schema,
        title,
        values: responseData || undefined,
      })
      setDownloadSuccess(true)
      successTimerRef.current = setTimeout(() => setDownloadSuccess(false), 2000)
    } catch {
      // PDF generation failed silently — the user sees the button revert
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`rounded-2xl border bg-surface p-4 shadow-sm transition-colors sm:p-5 ${
      isExpired
        ? 'border-primary-200 border-dashed'
        : 'border-primary-100 hover:border-primary-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <p className="font-medium text-primary-800">{title}</p>

          {/* Date line */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-primary-400 dark:text-primary-600">
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
              <span className="inline-flex items-center gap-1.5 text-xs text-primary-500 dark:text-primary-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary-300 dark:border-primary-500" aria-hidden="true" />
                Not started
              </span>
            )}
            {assignment.status === 'assigned' && isExpired && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary-400 dark:text-primary-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary-200 dark:border-primary-400" aria-hidden="true" />
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

        {/* Action buttons */}
        <div className="shrink-0 flex items-center gap-2">
          {/* PDF download */}
          {schema && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-lg border border-primary-200 p-2 text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-primary-300 dark:text-primary-600 dark:hover:bg-primary-100 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:opacity-50"
              title={variant === 'completed' ? 'Download completed PDF' : 'Download blank PDF'}
              aria-label={variant === 'completed' ? 'Download completed PDF' : 'Download blank PDF'}
            >
              {downloading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : downloadSuccess ? (
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
            </button>
          )}

          {/* Primary action */}
          {isCurrent && assignment.status === 'assigned' && !isExpired && (
            <a
              href={`${appUrl}/hw/${assignment.token}`}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
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
              className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
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
              className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:border-primary-300 dark:text-primary-700 dark:hover:bg-primary-100 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
            >
              View my responses
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
