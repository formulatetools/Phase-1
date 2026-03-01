'use client'

import { useState, useRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { MultiEntryViewer } from '@/components/worksheets/multi-entry-viewer'
import { BlankPdfGenerator, type BlankPdfGeneratorHandle } from '@/components/homework/blank-pdf-generator'
import { ResponsePdfGenerator, type ResponsePdfGeneratorHandle } from './response-pdf-generator'

// ─── Types ───────────────────────────────────────────────────────

interface PortalAssignment {
  id: string
  token: string
  status: string
  worksheet_id: string
  assigned_at: string
  due_date: string | null
  expires_at: string
  completed_at: string | null
  withdrawn_at: string | null
  completion_method: string | null
}

interface PortalResponse {
  id: string
  assignment_id: string
  response_data: Record<string, unknown>
  completed_at: string | null
}

interface PortalWorksheet {
  id: string
  title: string
  description: string
  schema: WorksheetSchema
}

interface ClientPortalProps {
  portalToken: string
  clientLabel: string
  therapistName: string
  assignments: PortalAssignment[]
  responses: PortalResponse[]
  worksheets: PortalWorksheet[]
  appUrl: string
}

// ─── Status helpers ──────────────────────────────────────────────

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  reviewed: 'bg-green-50 text-green-700',
  pdf_downloaded: 'bg-purple-50 text-purple-700',
  withdrawn: 'bg-red-50 text-red-600',
}

const statusLabels: Record<string, string> = {
  assigned: 'Pending',
  in_progress: 'In progress',
  completed: 'Submitted',
  reviewed: 'Reviewed',
  pdf_downloaded: 'Paper copy',
  withdrawn: 'Withdrawn',
}

// ─── Component ───────────────────────────────────────────────────

export function ClientPortal({
  portalToken,
  clientLabel,
  therapistName,
  assignments,
  responses,
  worksheets,
  appUrl,
}: ClientPortalProps) {
  const [viewingResponse, setViewingResponse] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('')
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [deletedAssignments, setDeletedAssignments] = useState<Set<string>>(new Set())
  const [allDeleted, setAllDeleted] = useState(false)
  const [generatingPdfFor, setGeneratingPdfFor] = useState<string | null>(null)
  const blankPdfRefs = useRef<Map<string, BlankPdfGeneratorHandle>>(new Map())
  const responsePdfRefs = useRef<Map<string, ResponsePdfGeneratorHandle>>(new Map())

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))
  const responseMap = new Map(responses.map((r) => [r.assignment_id, r]))

  const isExpired = (a: PortalAssignment) => new Date(a.expires_at) < new Date()

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

  // ─── Post-deletion view ──────────────────────────────────────

  if (allDeleted) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary-900">Data deleted</h2>
          <p className="mt-2 text-sm text-primary-500">
            All your homework responses have been permanently deleted. Your therapist has been notified.
          </p>
          <p className="mt-4 text-xs text-primary-400">
            If you are assigned new homework in the future, you will be asked for consent again before any data is stored.
          </p>
        </div>
      </div>
    )
  }

  // ─── Main portal view ────────────────────────────────────────

  // Determine if any assignments have deletable data
  const hasDeletableData = assignments.some(
    (a) =>
      !deletedAssignments.has(a.id) &&
      a.status !== 'withdrawn' &&
      a.status !== 'assigned' &&
      a.status !== 'pdf_downloaded'
  )

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-primary-900">Your homework</h1>
        <p className="mt-1 text-sm text-primary-500">
          This page shows all worksheets assigned to you by {therapistName}.
          You can view your responses, download PDFs, or delete your data at any time.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 rounded">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
          <p className="text-sm text-primary-500">No worksheets have been assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const worksheet = worksheetMap.get(a.worksheet_id)
            const response = responseMap.get(a.id)
            const isWithdrawn = a.status === 'withdrawn' || deletedAssignments.has(a.id)
            const isViewing = viewingResponse === a.id
            const expired = isExpired(a)

            return (
              <div
                key={a.id}
                className={`rounded-2xl border bg-surface shadow-sm overflow-hidden ${
                  isWithdrawn ? 'border-red-100 opacity-60' : 'border-primary-100'
                }`}
              >
                {/* Assignment header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary-800 truncate">
                        {worksheet?.title || 'Unknown worksheet'}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isWithdrawn
                          ? statusColors.withdrawn
                          : statusColors[a.status] || 'bg-primary-100 text-primary-500'
                      }`}>
                        {isWithdrawn ? 'Withdrawn' : statusLabels[a.status] || a.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-400">
                      <span>Assigned {new Date(a.assigned_at).toLocaleDateString('en-GB')}</span>
                      {a.due_date && <span>Due {new Date(a.due_date).toLocaleDateString('en-GB')}</span>}
                      {isWithdrawn && a.withdrawn_at && (
                        <span className="text-red-500">
                          Deleted {new Date(a.withdrawn_at).toLocaleDateString('en-GB')}
                        </span>
                      )}
                      {a.completed_at && !isWithdrawn && (
                        <span>Completed {new Date(a.completed_at).toLocaleDateString('en-GB')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 ml-3 shrink-0 sm:ml-4 sm:gap-2">
                    {/* Complete Now — for assigned, non-expired */}
                    {a.status === 'assigned' && !expired && !isWithdrawn && (
                      <a
                        href={`${appUrl}/hw/${a.token}`}
                        className="rounded-lg bg-primary-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                      >
                        Complete Now
                      </a>
                    )}

                    {/* Continue — for in_progress */}
                    {a.status === 'in_progress' && !expired && !isWithdrawn && (
                      <a
                        href={`${appUrl}/hw/${a.token}`}
                        className="rounded-lg bg-primary-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                      >
                        Continue
                      </a>
                    )}

                    {/* View response */}
                    {!isWithdrawn && response && (a.status === 'completed' || a.status === 'reviewed' || a.status === 'in_progress') && (
                      <button
                        onClick={() => setViewingResponse(isViewing ? null : a.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${
                          isViewing
                            ? 'bg-primary-800 text-white dark:bg-primary-800 dark:text-primary-50'
                            : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isViewing ? 'Hide' : 'View'}
                      </button>
                    )}

                    {/* Download response PDF */}
                    {!isWithdrawn && response && (a.status === 'completed' || a.status === 'reviewed') && (
                      <button
                        onClick={() => handleResponsePdf(a.id)}
                        disabled={generatingPdfFor === a.id}
                        className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center gap-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {generatingPdfFor === a.id ? 'Generating…' : 'PDF'}
                      </button>
                    )}

                    {/* Download blank PDF — for assigned */}
                    {a.status === 'assigned' && !isWithdrawn && worksheet && (
                      <button
                        onClick={() => handleBlankPdf(a.worksheet_id)}
                        disabled={generatingPdfFor === a.worksheet_id}
                        className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center gap-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span className="hidden sm:inline">{generatingPdfFor === a.worksheet_id ? 'Generating…' : 'Blank PDF'}</span>
                        <span className="sm:hidden">{generatingPdfFor === a.worksheet_id ? '…' : 'PDF'}</span>
                      </button>
                    )}

                    {/* Delete response */}
                    {!isWithdrawn && response && a.status !== 'assigned' && a.status !== 'pdf_downloaded' && (
                      <button
                        onClick={() => {
                          if (confirm('Permanently delete your response? This cannot be undone.')) {
                            handleDeleteResponse(a.id)
                          }
                        }}
                        disabled={deletingId === a.id}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                      >
                        {deletingId === a.id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded response view */}
                {isViewing && response && worksheet && !isWithdrawn && (
                  <div className="border-t border-primary-100 bg-primary-50/50 p-6">
                    <div className="mb-4 text-sm text-primary-500">
                      {response.completed_at ? (
                        <span>
                          Completed {new Date(response.completed_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span>In progress</span>
                      )}
                    </div>
                    <div className="rounded-xl border border-primary-200 bg-surface p-6">
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

      {/* Delete all data section */}
      {hasDeletableData && (
        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-800">Delete all my data</h3>
              <p className="mt-1 text-xs text-red-600/80">
                Permanently delete all your homework responses and withdraw consent.
                This cannot be undone.
              </p>
            </div>
            {!showDeleteAll ? (
              <button
                onClick={() => setShowDeleteAll(true)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
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
                  className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleteAllLoading || deleteAllConfirm !== 'DELETE'}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                  >
                    {deleteAllLoading ? 'Deleting…' : 'Confirm deletion'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteAll(false); setDeleteAllConfirm('') }}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
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
            <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Your data is stored securely and encrypted.
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Only you and your therapist can see your responses.
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            You can delete any or all of your data at any time.
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
