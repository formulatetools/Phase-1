'use client'

import { useState, useRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { MultiEntryViewer } from '@/components/worksheets/multi-entry-viewer'
import {
  BlankPdfGenerator,
  type BlankPdfGeneratorHandle,
} from '@/components/homework/blank-pdf-generator'
import {
  ResponsePdfGenerator,
  type ResponsePdfGeneratorHandle,
} from './response-pdf-generator'

// ─── Types ───────────────────────────────────────────────────────

interface DataAssignment {
  id: string
  token: string
  status: string
  worksheet_id: string
  assigned_at: string
  due_date: string | null
  expires_at: string
  completed_at: string | null
  withdrawn_at: string | null
}

interface DataResponse {
  id: string
  assignment_id: string
  response_data: Record<string, unknown>
  completed_at: string | null
}

interface DataWorksheet {
  id: string
  title: string
  description: string
  schema: WorksheetSchema
}

interface DataManagementProps {
  portalToken: string
  hasPinSet: boolean
  pinSetAt: string | null
  appUrl: string
  assignments: DataAssignment[]
  responses: DataResponse[]
  worksheets: DataWorksheet[]
}

// ─── Status helpers ──────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  assigned: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  reviewed: 'Completed',
  pdf_downloaded: 'Paper copy',
  withdrawn: 'Withdrawn',
}

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  reviewed: 'bg-green-50 text-green-700',
  pdf_downloaded: 'bg-purple-50 text-purple-700',
  withdrawn: 'bg-red-50 text-red-600',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────

export function DataManagement({
  portalToken,
  hasPinSet: initialHasPinSet,
  pinSetAt: initialPinSetAt,
  appUrl,
  assignments,
  responses,
  worksheets,
}: DataManagementProps) {
  const [viewingResponse, setViewingResponse] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('')
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [deletedAssignments, setDeletedAssignments] = useState<Set<string>>(
    new Set()
  )
  const [allDeleted, setAllDeleted] = useState(false)
  const [generatingPdfFor, setGeneratingPdfFor] = useState<string | null>(null)

  // PIN management state
  const [hasPinSet, setHasPinSet] = useState(initialHasPinSet)
  const [pinSetAt, setPinSetAt] = useState(initialPinSetAt)
  const [pinAction, setPinAction] = useState<'none' | 'set' | 'change' | 'remove'>('none')
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [pinConfirmDigits, setPinConfirmDigits] = useState(['', '', '', ''])
  const [pinCurrentDigits, setPinCurrentDigits] = useState(['', '', '', ''])
  const [pinStep, setPinStep] = useState<'current' | 'enter' | 'confirm'>('enter')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const pinConfirmRefs = useRef<(HTMLInputElement | null)[]>([])
  const pinCurrentRefs = useRef<(HTMLInputElement | null)[]>([])
  const blankPdfRefs = useRef<Map<string, BlankPdfGeneratorHandle>>(new Map())
  const responsePdfRefs = useRef<Map<string, ResponsePdfGeneratorHandle>>(
    new Map()
  )

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))
  const responseMap = new Map(responses.map((r) => [r.assignment_id, r]))

  // ─── Handlers ────────────────────────────────────────────────

  const handleDeleteResponse = async (assignmentId: string) => {
    setError(null)
    setDeletingId(assignmentId)

    try {
      const res = await fetch('/api/client-portal/delete-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, assignmentId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }

      setDeletedAssignments((prev) => new Set([...prev, assignmentId]))
      setViewingResponse(null)
      setSuccessMsg('Response deleted permanently.')
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (deleteAllConfirm !== 'DELETE') return
    setError(null)
    setDeleteAllLoading(true)

    try {
      const res = await fetch('/api/client-portal/delete-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, confirmText: 'DELETE' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }

      setAllDeleted(true)
      setShowDeleteAll(false)
      setDeleteAllConfirm('')
      setSuccessMsg('All your data has been permanently deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeleteAllLoading(false)
    }
  }

  const handleBlankPdf = async (worksheetId: string) => {
    setGeneratingPdfFor(worksheetId)
    try {
      const handle = blankPdfRefs.current.get(worksheetId)
      if (handle) await handle.generatePdf()
    } catch {
      setError('PDF generation failed. Please try again.')
    } finally {
      setGeneratingPdfFor(null)
    }
  }

  const handleResponsePdf = async (assignmentId: string) => {
    setGeneratingPdfFor(assignmentId)
    try {
      const handle = responsePdfRefs.current.get(assignmentId)
      if (handle) await handle.generatePdf()
    } catch {
      setError('PDF generation failed. Please try again.')
    } finally {
      setGeneratingPdfFor(null)
    }
  }

  // ─── PIN helpers ─────────────────────────────────────────────

  const handlePinDigitChange = (
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    value: string
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setPinError(null)
    if (digit && index < 3) refs.current[index + 1]?.focus()
  }

  const handlePinKeyDown = (
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    e: React.KeyboardEvent
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
    }
  }

  const resetPinForm = () => {
    setPinAction('none')
    setPinStep('enter')
    setPinDigits(['', '', '', ''])
    setPinConfirmDigits(['', '', '', ''])
    setPinCurrentDigits(['', '', '', ''])
    setPinError(null)
  }

  const handleSetPin = async () => {
    const pinValue = pinDigits.join('')
    const confirmValue = pinConfirmDigits.join('')
    if (pinValue !== confirmValue) {
      setPinError('PINs don\'t match. Try again.')
      setPinConfirmDigits(['', '', '', ''])
      setTimeout(() => pinConfirmRefs.current[0]?.focus(), 100)
      return
    }
    setPinLoading(true)
    setPinError(null)
    try {
      const res = await fetch(`${appUrl}/api/client-portal/pin/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, pin: pinValue }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHasPinSet(true)
        setPinSetAt(new Date().toISOString())
        resetPinForm()
        setSuccessMsg('PIN set successfully.')
        setTimeout(() => setSuccessMsg(null), 5000)
        return
      }
      setPinError(data.error || 'Failed to set PIN')
    } catch {
      setPinError('Network error. Please try again.')
    } finally {
      setPinLoading(false)
    }
  }

  const handleChangePin = async () => {
    const currentValue = pinCurrentDigits.join('')
    const newValue = pinDigits.join('')
    const confirmValue = pinConfirmDigits.join('')
    if (newValue !== confirmValue) {
      setPinError('New PINs don\'t match. Try again.')
      setPinConfirmDigits(['', '', '', ''])
      setTimeout(() => pinConfirmRefs.current[0]?.focus(), 100)
      return
    }
    setPinLoading(true)
    setPinError(null)
    try {
      const res = await fetch(`${appUrl}/api/client-portal/pin/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, currentPin: currentValue, newPin: newValue }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPinSetAt(new Date().toISOString())
        resetPinForm()
        setSuccessMsg('PIN changed successfully.')
        setTimeout(() => setSuccessMsg(null), 5000)
        return
      }
      if (res.status === 401) {
        setPinError(`Incorrect current PIN.${data.attemptsRemaining !== undefined ? ` ${data.attemptsRemaining} attempts remaining.` : ''}`)
        setPinCurrentDigits(['', '', '', ''])
        setPinStep('current')
        setTimeout(() => pinCurrentRefs.current[0]?.focus(), 100)
        return
      }
      if (res.status === 429) {
        setPinError('Too many attempts. Please try again later.')
        return
      }
      setPinError(data.error || 'Failed to change PIN')
    } catch {
      setPinError('Network error. Please try again.')
    } finally {
      setPinLoading(false)
    }
  }

  const handleRemovePin = async () => {
    const currentValue = pinCurrentDigits.join('')
    setPinLoading(true)
    setPinError(null)
    try {
      const res = await fetch(`${appUrl}/api/client-portal/pin/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, currentPin: currentValue }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHasPinSet(false)
        setPinSetAt(null)
        resetPinForm()
        setSuccessMsg('PIN removed. Your workspace is no longer PIN-protected.')
        setTimeout(() => setSuccessMsg(null), 5000)
        return
      }
      if (res.status === 401) {
        setPinError(`Incorrect PIN.${data.attemptsRemaining !== undefined ? ` ${data.attemptsRemaining} attempts remaining.` : ''}`)
        setPinCurrentDigits(['', '', '', ''])
        setTimeout(() => pinCurrentRefs.current[0]?.focus(), 100)
        return
      }
      if (res.status === 429) {
        setPinError('Too many attempts. Please try again later.')
        return
      }
      setPinError(data.error || 'Failed to remove PIN')
    } catch {
      setPinError('Network error. Please try again.')
    } finally {
      setPinLoading(false)
    }
  }

  const renderPinInputs = (
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete?: () => void
  ) => (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => {
            handlePinDigitChange(digits, setDigits, refs, i, e.target.value)
            const newDigit = e.target.value.replace(/\D/g, '').slice(-1)
            if (newDigit && i === 3) {
              const newDigits = [...digits]
              newDigits[i] = newDigit
              if (newDigits.every((d) => d) && onComplete) {
                setTimeout(onComplete, 50)
              }
            }
          }}
          onKeyDown={(e) => handlePinKeyDown(digits, setDigits, refs, i, e)}
          disabled={pinLoading}
          className="h-11 w-10 rounded-lg border-2 border-primary-200 text-center text-lg font-bold text-primary-900 focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none disabled:opacity-50"
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  )

  // ─── Post-deletion view ──────────────────────────────────────

  if (allDeleted) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-7 w-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary-900">Data deleted</h2>
          <p className="mt-2 text-sm text-primary-500">
            All your homework responses have been permanently deleted. Your
            therapist has been notified.
          </p>
          <p className="mt-4 text-xs text-primary-400">
            If you are assigned new homework in the future, you will be asked
            for consent again before any data is stored.
          </p>
        </div>
      </div>
    )
  }

  // ─── Main view ───────────────────────────────────────────────

  const hasDeletableData = assignments.some(
    (a) =>
      !deletedAssignments.has(a.id) &&
      a.status !== 'withdrawn' &&
      a.status !== 'assigned' &&
      a.status !== 'pdf_downloaded'
  )

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 rounded"
          >
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
          <p className="text-sm text-primary-500">
            No worksheets have been assigned yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const worksheet = worksheetMap.get(a.worksheet_id)
            const response = responseMap.get(a.id)
            const isWithdrawn =
              a.status === 'withdrawn' || deletedAssignments.has(a.id)
            const isViewing = viewingResponse === a.id

            return (
              <div
                key={a.id}
                className={`rounded-2xl border bg-surface shadow-sm overflow-hidden ${
                  isWithdrawn
                    ? 'border-red-100 opacity-60'
                    : 'border-primary-100'
                }`}
              >
                {/* Assignment header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-primary-800 truncate">
                          {worksheet?.title || 'Unknown worksheet'}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isWithdrawn
                              ? statusColors.withdrawn
                              : statusColors[a.status] ||
                                'bg-primary-100 text-primary-500'
                          }`}
                        >
                          {isWithdrawn
                            ? 'Withdrawn'
                            : statusLabels[a.status] || a.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-primary-400">
                        <span>Assigned {formatDate(a.assigned_at)}</span>
                        {a.completed_at && !isWithdrawn && (
                          <span>Completed {formatDate(a.completed_at)}</span>
                        )}
                        {isWithdrawn && a.withdrawn_at && (
                          <span className="text-red-500">
                            Deleted {formatDate(a.withdrawn_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  {!isWithdrawn && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {/* View response */}
                      {response &&
                        (a.status === 'completed' ||
                          a.status === 'reviewed' ||
                          a.status === 'in_progress') && (
                          <button
                            onClick={() =>
                              setViewingResponse(isViewing ? null : a.id)
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${
                              isViewing
                                ? 'bg-primary-800 text-white'
                                : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                            }`}
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
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {isViewing ? 'Hide response' : 'View response'}
                          </button>
                        )}

                      {/* Download response PDF */}
                      {response &&
                        (a.status === 'completed' ||
                          a.status === 'reviewed') && (
                          <button
                            onClick={() => handleResponsePdf(a.id)}
                            disabled={generatingPdfFor === a.id}
                            className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
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
                            {generatingPdfFor === a.id
                              ? 'Generating\u2026'
                              : 'Download PDF'}
                          </button>
                        )}

                      {/* Download blank PDF */}
                      {a.status === 'assigned' && worksheet && (
                        <button
                          onClick={() => handleBlankPdf(a.worksheet_id)}
                          disabled={generatingPdfFor === a.worksheet_id}
                          className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
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
                          {generatingPdfFor === a.worksheet_id
                            ? 'Generating\u2026'
                            : 'Blank PDF'}
                        </button>
                      )}

                      {/* Delete response */}
                      {response &&
                        a.status !== 'assigned' &&
                        a.status !== 'pdf_downloaded' && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  'Permanently delete your response? This cannot be undone.'
                                )
                              ) {
                                handleDeleteResponse(a.id)
                              }
                            }}
                            disabled={deletingId === a.id}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
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
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                            {deletingId === a.id
                              ? 'Deleting\u2026'
                              : 'Delete'}
                          </button>
                        )}
                    </div>
                  )}
                </div>

                {/* Expanded response view */}
                {isViewing && response && worksheet && !isWithdrawn && (
                  <div className="border-t border-primary-100 bg-primary-50/50 p-4 sm:p-6">
                    <div className="mb-4 text-xs text-primary-400">
                      {response.completed_at && (
                        <span>
                          Completed{' '}
                          {new Date(response.completed_at).toLocaleDateString(
                            'en-GB',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border border-primary-200 bg-surface p-4 sm:p-6">
                      <MultiEntryViewer
                        schema={worksheet.schema}
                        responseData={response.response_data}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* PIN Protection section */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-primary-800">PIN Protection</h3>
            <p className="mt-1 text-xs text-primary-500">
              {hasPinSet
                ? 'Your workspace is protected with a PIN. You\'ll need to enter it each time you visit.'
                : 'Add a 4-digit PIN to protect your therapy workspace on shared devices.'}
            </p>
          </div>
          {hasPinSet ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
              Enabled
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-300" aria-hidden="true" />
              Not set
            </span>
          )}
        </div>

        {hasPinSet && pinSetAt && (
          <p className="mt-2 text-[10px] text-primary-400">
            Set on {formatDate(pinSetAt)}
          </p>
        )}

        {/* PIN action buttons */}
        {pinAction === 'none' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasPinSet ? (
              <>
                <button
                  onClick={() => {
                    setPinAction('change')
                    setPinStep('current')
                    setTimeout(() => pinCurrentRefs.current[0]?.focus(), 100)
                  }}
                  className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors min-h-[44px]"
                >
                  Change PIN
                </button>
                <button
                  onClick={() => {
                    setPinAction('remove')
                    setPinStep('current')
                    setTimeout(() => pinCurrentRefs.current[0]?.focus(), 100)
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                >
                  Remove PIN
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setPinAction('set')
                  setPinStep('enter')
                  setTimeout(() => pinInputRefs.current[0]?.focus(), 100)
                }}
                className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white hover:bg-primary-900 transition-colors min-h-[44px]"
              >
                Set up PIN
              </button>
            )}
          </div>
        )}

        {/* Set PIN form */}
        {pinAction === 'set' && (
          <div className="mt-4 space-y-3 text-center">
            <p className="text-xs font-medium text-primary-700">
              {pinStep === 'enter' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
            </p>
            {pinStep === 'enter'
              ? renderPinInputs(pinDigits, setPinDigits, pinInputRefs, () => {
                  setPinStep('confirm')
                  setPinConfirmDigits(['', '', '', ''])
                  setTimeout(() => pinConfirmRefs.current[0]?.focus(), 100)
                })
              : renderPinInputs(pinConfirmDigits, setPinConfirmDigits, pinConfirmRefs, handleSetPin)
            }
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
            <div className="flex justify-center gap-2">
              {pinStep === 'confirm' && (
                <button
                  onClick={() => {
                    setPinStep('enter')
                    setPinDigits(['', '', '', ''])
                    setPinError(null)
                    setTimeout(() => pinInputRefs.current[0]?.focus(), 100)
                  }}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={resetPinForm}
                className="rounded-lg px-3 py-1.5 text-xs text-primary-400 hover:text-primary-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Change PIN form */}
        {pinAction === 'change' && (
          <div className="mt-4 space-y-3 text-center">
            <p className="text-xs font-medium text-primary-700">
              {pinStep === 'current'
                ? 'Enter your current PIN'
                : pinStep === 'enter'
                  ? 'Choose a new 4-digit PIN'
                  : 'Confirm your new PIN'}
            </p>
            {pinStep === 'current'
              ? renderPinInputs(pinCurrentDigits, setPinCurrentDigits, pinCurrentRefs, () => {
                  setPinStep('enter')
                  setPinDigits(['', '', '', ''])
                  setTimeout(() => pinInputRefs.current[0]?.focus(), 100)
                })
              : pinStep === 'enter'
                ? renderPinInputs(pinDigits, setPinDigits, pinInputRefs, () => {
                    setPinStep('confirm')
                    setPinConfirmDigits(['', '', '', ''])
                    setTimeout(() => pinConfirmRefs.current[0]?.focus(), 100)
                  })
                : renderPinInputs(pinConfirmDigits, setPinConfirmDigits, pinConfirmRefs, handleChangePin)
            }
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
            <div className="flex justify-center gap-2">
              {pinStep !== 'current' && (
                <button
                  onClick={() => {
                    if (pinStep === 'confirm') {
                      setPinStep('enter')
                      setPinDigits(['', '', '', ''])
                    } else {
                      setPinStep('current')
                      setPinCurrentDigits(['', '', '', ''])
                    }
                    setPinError(null)
                  }}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={resetPinForm}
                className="rounded-lg px-3 py-1.5 text-xs text-primary-400 hover:text-primary-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Remove PIN form */}
        {pinAction === 'remove' && (
          <div className="mt-4 space-y-3 text-center">
            <p className="text-xs font-medium text-primary-700">Enter your current PIN to remove it</p>
            {renderPinInputs(pinCurrentDigits, setPinCurrentDigits, pinCurrentRefs, handleRemovePin)}
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
            <div className="flex justify-center gap-2">
              <button
                onClick={resetPinForm}
                className="rounded-lg px-3 py-1.5 text-xs text-primary-400 hover:text-primary-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete all data section */}
      {hasDeletableData && (
        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                Delete all my data
              </h3>
              <p className="mt-1 text-xs text-red-600/80">
                Permanently delete all your homework responses and withdraw
                consent. This cannot be undone.
              </p>
            </div>
            {!showDeleteAll ? (
              <button
                onClick={() => setShowDeleteAll(true)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              >
                Delete all data
              </button>
            ) : (
              <div className="shrink-0 space-y-2">
                <p className="text-xs text-red-700">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteAllConfirm}
                  onChange={(e) => setDeleteAllConfirm(e.target.value)}
                  placeholder="DELETE"
                  aria-label="Type DELETE to confirm data deletion"
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAll}
                    disabled={
                      deleteAllLoading || deleteAllConfirm !== 'DELETE'
                    }
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                  >
                    {deleteAllLoading
                      ? 'Deleting\u2026'
                      : 'Confirm deletion'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteAll(false)
                      setDeleteAllConfirm('')
                    }}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy notice */}
      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5 text-xs text-primary-500 space-y-2">
        <p className="font-medium text-primary-600">Your privacy</p>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-3 w-3 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Your data is stored securely and encrypted.
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-3 w-3 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Only you and your therapist can see your responses.
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-3 w-3 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            You can delete any or all of your data at any time.
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-3 w-3 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Deletion is permanent and cannot be undone.
          </li>
        </ul>
      </div>

      {/* Hidden PDF generators */}
      {worksheets.map((w) => (
        <BlankPdfGenerator
          key={`blank-${w.id}`}
          ref={(handle) => {
            if (handle) blankPdfRefs.current.set(w.id, handle)
            else blankPdfRefs.current.delete(w.id)
          }}
          schema={w.schema}
          worksheetTitle={w.title}
        />
      ))}
      {assignments.map((a) => {
        const response = responseMap.get(a.id)
        const worksheet = worksheetMap.get(a.worksheet_id)
        if (!response || !worksheet) return null
        return (
          <ResponsePdfGenerator
            key={`response-${a.id}`}
            ref={(handle) => {
              if (handle) responsePdfRefs.current.set(a.id, handle)
              else responsePdfRefs.current.delete(a.id)
            }}
            schema={worksheet.schema}
            worksheetTitle={worksheet.title}
            responseData={response.response_data}
          />
        )
      })}
    </div>
  )
}
