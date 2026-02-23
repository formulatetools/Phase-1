'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

interface HomeworkFormProps {
  token: string
  schema: WorksheetSchema
  existingResponse?: Record<string, unknown>
  isCompleted: boolean
  readOnly: boolean
}

export function HomeworkForm({
  token,
  schema,
  existingResponse,
  isCompleted,
  readOnly,
}: HomeworkFormProps) {
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(isCompleted)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const valuesRef = useRef<Record<string, FieldValue>>({})
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasChangesRef = useRef(false)

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (readOnly || submitted) return

    const interval = setInterval(() => {
      if (hasChangesRef.current) {
        autoSave()
      }
    }, 30000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, submitted])

  const autoSave = useCallback(async () => {
    if (readOnly || submitted) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          response_data: valuesRef.current,
          action: 'save',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setLastSaved(new Date())
      hasChangesRef.current = false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [token, readOnly, submitted])

  const handleValuesChange = useCallback(
    (newValues: Record<string, FieldValue>) => {
      valuesRef.current = newValues
      hasChangesRef.current = true

      // Debounced auto-save on change (reset timer)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave()
      }, 5000) // Save 5s after last change
    },
    [autoSave]
  )

  const handleSubmit = async () => {
    if (readOnly || submitted) return
    setSubmitting(true)
    setError(null)

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          response_data: valuesRef.current,
          action: 'submit',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  // Submitted confirmation
  if (submitted && !existingResponse) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-primary-900">Homework submitted!</h2>
        <p className="mt-2 text-sm text-primary-500">
          Your responses have been sent to your therapist. You can close this page now.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Worksheet form */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
        <WorksheetRenderer
          schema={schema}
          readOnly={readOnly}
          initialValues={existingResponse}
          onValuesChange={readOnly ? undefined : handleValuesChange}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action bar */}
      {!readOnly && (
        <div className="flex items-center justify-between rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm">
          <div className="text-xs text-primary-400">
            {saving && 'Saving…'}
            {!saving && lastSaved && (
              <>Saved {lastSaved.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</>
            )}
            {!saving && !lastSaved && existingResponse && 'Draft saved'}
            {!saving && !lastSaved && !existingResponse && 'Your progress is saved automatically'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={autoSave}
              disabled={saving}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition-colors"
            >
              Save draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-primary-800 px-6 py-2 text-sm font-medium text-white hover:bg-primary-900 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Already submitted indicator */}
      {submitted && existingResponse && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          This worksheet has been submitted. Your therapist can see your responses.
        </div>
      )}
    </div>
  )
}
