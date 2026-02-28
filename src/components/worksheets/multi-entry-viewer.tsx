'use client'

import { useState } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { isMultiEntryResponse } from '@/types/worksheet'
import { WorksheetRenderer } from './worksheet-renderer'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

interface MultiEntryViewerProps {
  schema: WorksheetSchema
  responseData: Record<string, unknown>
}

/**
 * Read-only viewer that handles both single-entry and multi-entry (diary mode) responses.
 * Detects `{ _entries: [...] }` format and renders tabbed entries,
 * falling back to a single WorksheetRenderer for flat responses.
 */
export function MultiEntryViewer({ schema, responseData }: MultiEntryViewerProps) {
  const isMulti = isMultiEntryResponse(responseData)
  const entries = isMulti
    ? (responseData as { _entries: Record<string, FieldValue>[] })._entries
    : null

  const [activeIndex, setActiveIndex] = useState(0)

  // Single-entry — render WorksheetRenderer directly
  if (!isMulti || !entries || entries.length === 0) {
    return (
      <WorksheetRenderer
        schema={schema}
        readOnly
        initialValues={responseData}
      />
    )
  }

  // Multi-entry — tabbed view
  return (
    <div className="space-y-4">
      {/* Entry tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {entries.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              i === activeIndex
                ? 'bg-brand text-white shadow-sm'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-700 dark:text-primary-300'
            }`}
          >
            Entry {i + 1}
          </button>
        ))}
        <span className="text-xs text-primary-400 ml-1">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Active entry */}
      <WorksheetRenderer
        key={`entry-${activeIndex}`}
        schema={schema}
        readOnly
        initialValues={entries[activeIndex] as Record<string, unknown>}
      />
    </div>
  )
}
