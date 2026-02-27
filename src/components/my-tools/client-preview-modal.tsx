'use client'

import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { LogoIcon } from '@/components/ui/logo'

interface ClientPreviewModalProps {
  title: string
  description: string
  instructions: string
  schema: WorksheetSchema
  onClose: () => void
  onSave?: () => void
  saving?: boolean
}

export function ClientPreviewModal({
  title,
  description,
  instructions,
  schema,
  onClose,
  onSave,
  saving,
}: ClientPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-primary-100 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-500">
            <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Client preview
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save to My Tools'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              {onSave ? 'Edit first' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content — matches homework page layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          {/* Worksheet header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary-900">
              {title || 'Untitled Worksheet'}
            </h1>
            {description && (
              <p className="mt-2 text-sm text-primary-500">{description}</p>
            )}
            {instructions && (
              <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm text-primary-700">
                {instructions}
              </div>
            )}
          </div>

          {/* Custom worksheet disclaimer (matches homework page) */}
          <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-600">
            This worksheet was created by your therapist, not by Formulate.
            Formulate does not review or validate custom clinical content.
          </div>

          {/* Worksheet form */}
          {schema.sections.length > 0 ? (
            <WorksheetRenderer
              schema={schema}
              readOnly={false}
            />
          ) : (
            <div className="py-12 text-center text-sm text-primary-300">
              No sections to preview
            </div>
          )}

          {/* Footer — matches homework page */}
          <div className="mt-12 flex items-center justify-center gap-1.5 text-xs text-primary-400">
            <LogoIcon size={14} />
            <span>Formulate</span>
          </div>
        </div>
      </div>
    </div>
  )
}
