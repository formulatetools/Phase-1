'use client'

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
  return (
    <div className="space-y-8">
      {/* Read-only response display */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm sm:p-6">
        <MultiEntryViewer schema={schema} responseData={responseData} />
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
