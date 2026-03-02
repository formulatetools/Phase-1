'use client'

import { useState } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { MultiEntryViewer } from '@/components/worksheets/multi-entry-viewer'
import { ResponseDeleteButton } from './response-delete-button'

interface ResponseViewerProps {
  schema: WorksheetSchema
  responseData: Record<string, unknown>
  portalToken: string
  assignmentId: string
  worksheetTitle: string
}

export function ResponseViewer({
  schema,
  responseData,
  portalToken,
  assignmentId,
  worksheetTitle,
}: ResponseViewerProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const { downloadFillablePdf } = await import('@/lib/utils/fillable-pdf')
      await downloadFillablePdf({
        schema,
        title: worksheetTitle,
        showBranding: true,
        values: responseData,
      })
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Read-only response display */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm sm:p-6">
        <MultiEntryViewer schema={schema} responseData={responseData} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:border-primary-300 dark:text-primary-700 dark:hover:bg-primary-100 disabled:opacity-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {downloading ? 'Generating\u2026' : 'Download PDF'}
        </button>
      </div>

      {/* Delete button */}
      <div className="border-t border-primary-100 pt-6">
        <ResponseDeleteButton
          portalToken={portalToken}
          assignmentId={assignmentId}
          worksheetTitle={worksheetTitle}
        />
      </div>
    </div>
  )
}
