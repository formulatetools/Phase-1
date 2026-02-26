'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { BlankPdfGenerator, type BlankPdfGeneratorHandle } from './blank-pdf-generator'
import { downloadInteractiveHtml } from '@/lib/utils/html-worksheet-export'
import { useOnlineStatus } from '@/hooks/use-online-status'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

// Connection states for the status indicator
type ConnectionStatus = 'connected' | 'saving' | 'offline' | 'reconnecting' | 'error'

interface HomeworkFormProps {
  token: string
  schema: WorksheetSchema
  existingResponse?: Record<string, unknown>
  isCompleted: boolean
  readOnly: boolean
  isPreview?: boolean
  worksheetTitle?: string
  worksheetDescription?: string | null
  worksheetInstructions?: string | null
  portalUrl?: string | null
}

// Exponential backoff config
const INITIAL_RETRY_DELAY = 2000 // 2s
const MAX_RETRY_DELAY = 60000 // 60s
const DEBOUNCE_DELAY = 5000 // 5s after last change
const PERIODIC_SAVE_INTERVAL = 30000 // 30s

export function HomeworkForm({
  token,
  schema,
  existingResponse,
  isCompleted,
  readOnly,
  isPreview = false,
  worksheetTitle,
  worksheetDescription,
  worksheetInstructions,
  portalUrl,
}: HomeworkFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(isCompleted)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const [displayValues, setDisplayValues] = useState<Record<string, FieldValue>>({})
  const valuesRef = useRef<Record<string, FieldValue>>({})
  const hasChangesRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY)
  const isSavingRef = useRef(false)
  const pdfRef = useRef<BlankPdfGeneratorHandle>(null)

  const { isOnline, markOffline, markOnline } = useOnlineStatus()

  // ── Core save function with error classification ────────────────────────
  const doSave = useCallback(async (): Promise<boolean> => {
    if (readOnly || submitted || isPreview) return true
    if (isSavingRef.current) return false // already in flight

    isSavingRef.current = true
    setConnectionStatus('saving')
    setErrorMessage(null)

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
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }

      // Success — reset backoff, update state
      retryDelayRef.current = INITIAL_RETRY_DELAY
      hasChangesRef.current = false
      setLastSaved(new Date())
      setConnectionStatus('connected')
      markOnline()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      const isNetworkError = message === 'Failed to fetch' || message === 'Load failed' || !navigator.onLine

      if (isNetworkError) {
        setConnectionStatus('offline')
        markOffline()
      } else {
        setConnectionStatus('error')
        setErrorMessage(message)
      }
      return false
    } finally {
      isSavingRef.current = false
    }
  }, [token, readOnly, submitted, isPreview, markOffline, markOnline])

  // ── Retry with exponential backoff ──────────────────────────────────────
  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)

    retryTimerRef.current = setTimeout(async () => {
      if (!hasChangesRef.current) return
      setConnectionStatus('reconnecting')
      const success = await doSave()

      if (!success && hasChangesRef.current) {
        // Increase delay with exponential backoff
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY)
        scheduleRetry()
      }
    }, retryDelayRef.current)
  }, [doSave])

  // ── Auto-save: debounced on change ──────────────────────────────────────
  const debouncedSave = useCallback(async () => {
    const success = await doSave()
    if (!success && hasChangesRef.current) {
      scheduleRetry()
    }
  }, [doSave, scheduleRetry])

  // ── Periodic save every 30s ─────────────────────────────────────────────
  useEffect(() => {
    if (readOnly || submitted || isPreview) return

    const interval = setInterval(() => {
      if (hasChangesRef.current && !isSavingRef.current) {
        debouncedSave()
      }
    }, PERIODIC_SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [readOnly, submitted, isPreview, debouncedSave])

  // ── When browser goes back online, retry immediately ────────────────────
  useEffect(() => {
    if (!isOnline || readOnly || submitted || isPreview) return

    // If we have unsaved changes, save immediately on reconnect
    if (hasChangesRef.current) {
      retryDelayRef.current = INITIAL_RETRY_DELAY
      setConnectionStatus('reconnecting')
      debouncedSave()
    }

    // If we have a queued submit, fire it on reconnect
    if (pendingSubmit) {
      handleSubmitInternal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  // ── beforeunload protection ─────────────────────────────────────────────
  useEffect(() => {
    if (readOnly || submitted || isPreview) return

    const handler = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [readOnly, submitted, isPreview])

  // ── Cleanup timers on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  // ── Values change handler ───────────────────────────────────────────────
  const handleValuesChange = useCallback(
    (newValues: Record<string, FieldValue>) => {
      valuesRef.current = newValues
      hasChangesRef.current = true
      setDisplayValues(newValues)

      if (isPreview) return

      // Debounce: restart the save timer on each change
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        debouncedSave()
      }, DEBOUNCE_DELAY)
    },
    [debouncedSave, isPreview]
  )

  // ── Manual "Save draft" button ──────────────────────────────────────────
  const handleManualSave = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    const success = await doSave()
    if (!success && hasChangesRef.current) {
      scheduleRetry()
    }
  }, [doSave, scheduleRetry])

  // ── Submit (internal — handles offline queueing) ────────────────────────
  const handleSubmitInternal = async () => {
    if (readOnly || submitted || isPreview) return
    setPendingSubmit(false)
    setSubmitting(true)
    setErrorMessage(null)

    // Clear any pending auto-save
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)

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
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit')
      }

      hasChangesRef.current = false
      setSubmitted(true)
      setConnectionStatus('connected')
      markOnline()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit'
      const isNetworkError = message === 'Failed to fetch' || message === 'Load failed' || !navigator.onLine

      if (isNetworkError) {
        // Queue the submit for when we come back online
        setPendingSubmit(true)
        setConnectionStatus('offline')
        markOffline()
      } else {
        setErrorMessage(message)
        setConnectionStatus('error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Public submit handler ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (readOnly || submitted || isPreview) return

    if (!isOnline) {
      // Queue submission for when we reconnect
      setPendingSubmit(true)
      return
    }

    await handleSubmitInternal()
  }

  const handleBlankPdfDownload = async () => {
    setGeneratingPdf(true)
    try {
      if (pdfRef.current) {
        await pdfRef.current.generatePdf()
      }

      await fetch('/api/homework/pdf-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setGeneratingPdf(false)
    }
  }

  // ── Progress computation ───────────────────────────────────────────────
  const progress = useMemo(() => {
    const fields = schema.sections.flatMap(s => s.fields || [])
    // Count fillable fields (exclude computed, formulation, hierarchy types)
    const fillable = fields.filter(f =>
      f.type !== 'computed' && f.type !== 'formulation' && f.type !== 'hierarchy'
      && f.type !== 'decision_tree' && f.type !== 'safety_plan'
    )
    if (fillable.length === 0) return 100

    const vals = Object.keys(displayValues).length > 0
      ? displayValues
      : (existingResponse as Record<string, FieldValue> | undefined) || {}

    let filled = 0
    for (const field of fillable) {
      const v = vals[field.id]
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          if (v.length > 0) filled++
        } else if (typeof v === 'object') {
          // Table rows or nested values
          filled++
        } else {
          filled++
        }
      }
    }
    return Math.round((filled / fillable.length) * 100)
  }, [schema.sections, displayValues, existingResponse])

  // ── Submitted confirmation ──────────────────────────────────────────────
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
        {portalUrl && (
          <a
            href={portalUrl}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white dark:bg-surface px-4 py-2 text-sm font-medium text-primary-700 hover:bg-green-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View all your data
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress bar — thin amber bar at top */}
      {!readOnly && !submitted && (
        <div className="rounded-full bg-primary-100 h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Worksheet form */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-4 sm:p-6 shadow-sm">
        <WorksheetRenderer
          schema={schema}
          readOnly={readOnly}
          initialValues={existingResponse}
          onValuesChange={readOnly ? undefined : handleValuesChange}
        />
      </div>

      {/* Server error message */}
      {errorMessage && connectionStatus === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Action bar — sticky on mobile */}
      {!readOnly && !isPreview && (
        <div className="sticky bottom-0 z-10 -mx-4 px-4 pb-[env(safe-area-inset-bottom,0px)] sm:static sm:mx-0 sm:px-0 sm:pb-0">
          <div className="rounded-2xl border border-primary-100 bg-surface p-4 shadow-lg sm:shadow-sm space-y-3">
            {/* Connection status indicator */}
            <ConnectionIndicator
              status={connectionStatus}
              lastSaved={lastSaved}
              pendingSubmit={pendingSubmit}
              existingResponse={!!existingResponse}
            />

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={handleManualSave}
                disabled={connectionStatus === 'saving' || connectionStatus === 'offline'}
              >
                Save draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
              >
                {submitting ? 'Submitting…' : pendingSubmit ? 'Submit queued' : 'Submit'}
              </Button>
            </div>

            {/* Reassurance text */}
            <p className="text-center text-[11px] text-primary-400">
              Your responses are confidential and shared only with your therapist.
            </p>
          </div>
        </div>
      )}

      {/* Download options — subtle links below action bar */}
      {!readOnly && !submitted && !isPreview && worksheetTitle && (
        <div className="flex items-center justify-center gap-3 text-xs text-primary-400">
          <button
            onClick={handleBlankPdfDownload}
            disabled={generatingPdf}
            className="underline underline-offset-2 transition-colors hover:text-primary-600 disabled:opacity-50"
          >
            {generatingPdf ? 'Generating PDF…' : 'Download blank PDF ↓'}
          </button>
          <span>·</span>
          <button
            onClick={() => downloadInteractiveHtml(schema, worksheetTitle, worksheetDescription || undefined, worksheetInstructions || undefined)}
            className="underline underline-offset-2 transition-colors hover:text-primary-600"
          >
            Download interactive version ↓
          </button>
        </div>
      )}

      {/* Already submitted indicator */}
      {submitted && existingResponse && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="flex-1">This worksheet has been submitted. Your therapist can see your responses.</span>
          {portalUrl && (
            <a
              href={portalUrl}
              className="shrink-0 text-xs font-medium text-green-800 underline underline-offset-2 hover:text-green-900 transition-colors"
            >
              View all your data
            </a>
          )}
        </div>
      )}

      {/* Hidden blank PDF generator */}
      {worksheetTitle && (
        <BlankPdfGenerator
          ref={pdfRef}
          schema={schema}
          worksheetTitle={worksheetTitle}
        />
      )}
    </div>
  )
}

// ── Connection status indicator component ─────────────────────────────────

function ConnectionIndicator({
  status,
  lastSaved,
  pendingSubmit,
  existingResponse,
}: {
  status: ConnectionStatus
  lastSaved: Date | null
  pendingSubmit: boolean
  existingResponse: boolean
}) {
  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center gap-2 text-xs text-primary-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {lastSaved ? (
            <span>Saved {lastSaved.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          ) : existingResponse ? (
            <span>Draft saved</span>
          ) : (
            <span>Your progress is saved automatically</span>
          )}
        </div>
      )

    case 'saving':
      return (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Saving…</span>
        </div>
      )

    case 'offline':
      return (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span>
            Offline — your work is saved locally
            {pendingSubmit && '. Submission will be sent when you reconnect.'}
          </span>
        </div>
      )

    case 'reconnecting':
      return (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Reconnecting…</span>
        </div>
      )

    case 'error':
      return (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span>Save failed — will retry automatically</span>
        </div>
      )
  }
}
