'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/providers/toast-provider'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
  SubscriptionTier,
} from '@/types/database'
import {
  updateSuperviseeLabel,
  endSupervision,
  reactivateSupervisee,
  createSupervisionAssignment,
  lockSupervisionAssignment,
  markSupervisionReviewed,
  markSupervisionPaperCompleted,
  gdprEraseSupervision,
} from '@/app/(dashboard)/supervision/actions'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { MultiEntryViewer } from '@/components/worksheets/multi-entry-viewer'
import { ShareModal } from '@/components/ui/share-modal'

interface SuperviseeDetailProps {
  relationship: TherapeuticRelationship
  assignments: WorksheetAssignment[]
  responses: WorksheetResponse[]
  worksheets: Worksheet[]
  totalActiveAssignments: number
  maxActiveAssignments: number
  tier: SubscriptionTier
  appUrl: string
}

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  reviewed: 'bg-primary-100 text-primary-600',
  pdf_downloaded: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  withdrawn: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  reviewed: 'Reviewed',
  pdf_downloaded: 'PDF downloaded',
  withdrawn: 'Withdrawn',
}

export function SuperviseeDetail({
  relationship,
  assignments,
  responses,
  worksheets,
  totalActiveAssignments,
  maxActiveAssignments,
  tier,
  appUrl,
}: SuperviseeDetailProps) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [label, setLabel] = useState(relationship.client_label)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedWorksheet, setSelectedWorksheet] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [dueDate, setDueDate] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [viewingResponse, setViewingResponse] = useState<string | null>(null)
  const [showGdprConfirm, setShowGdprConfirm] = useState(false)
  const [gdprLoading, setGdprLoading] = useState(false)
  const { toast } = useToast()
  const [shareModal, setShareModal] = useState<{
    url: string
    title: string
    dueDate?: string
  } | null>(null)
  const [copiedPortalLink, setCopiedPortalLink] = useState(false)

  const canAssign = maxActiveAssignments === Infinity || totalActiveAssignments < maxActiveAssignments

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))
  const responseMap = new Map(responses.map((r) => [r.assignment_id, r]))

  const handleSaveLabel = async () => {
    if (!label.trim()) return
    await updateSuperviseeLabel(relationship.id, label)
    setEditingLabel(false)
  }

  const handleEndSupervision = async () => {
    if (!confirm('End supervision with this supervisee? They can be reactivated later.')) return
    await endSupervision(relationship.id)
  }

  const handleAssign = async () => {
    if (!selectedWorksheet) return
    setAssignLoading(true)
    setAssignError(null)

    const result = await createSupervisionAssignment(
      relationship.id,
      selectedWorksheet,
      dueDate || undefined,
      expiresInDays
    )

    if (result.error) {
      setAssignError(result.error)
    } else if (result.token) {
      const link = `${appUrl}/hw/${result.token}`
      const ws = worksheetMap.get(selectedWorksheet)

      setShareModal({
        url: link,
        title: ws?.title || 'Worksheet',
        dueDate: dueDate || undefined,
      })

      await navigator.clipboard.writeText(link)
      setCopiedToken(result.token)
      setShowAssign(false)
      setSelectedWorksheet('')
      setDueDate('')
      setExpiresInDays(7)
      setTimeout(() => setCopiedToken(null), 5000)
    }
    setAssignLoading(false)
  }

  const handleShareLink = (token: string, worksheetId: string, assignmentDueDate?: string | null) => {
    const link = `${appUrl}/hw/${token}`
    const ws = worksheetMap.get(worksheetId)
    setShareModal({
      url: link,
      title: ws?.title || 'Worksheet',
      dueDate: assignmentDueDate || undefined,
    })
  }

  const handleGdprErase = async () => {
    setGdprLoading(true)
    const result = await gdprEraseSupervision(relationship.id)
    if (result.success) {
      window.location.href = '/supervision'
    } else {
      toast({ type: 'error', message: result.error || 'Failed to delete supervisee data' })
      setGdprLoading(false)
      setShowGdprConfirm(false)
    }
  }

  const isExpired = (a: WorksheetAssignment) => new Date(a.expires_at) < new Date()

  // Group worksheets: supervision-category first, then custom tools, then other curated
  const supervisionWorksheets = worksheets.filter((w) => w.is_curated && w.tags?.includes('supervision'))
  const customWorksheets = worksheets.filter((w) => !w.is_curated)
  const otherCurated = worksheets.filter((w) => w.is_curated && !w.tags?.includes('supervision'))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/supervision" className="text-sm text-primary-400 hover:text-primary-600 transition-colors">
            ← Back to supervision
          </Link>
          <div className="mt-2 flex items-center gap-3">
            {editingLabel ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={50}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-lg font-bold focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                  autoFocus
                />
                <button
                  onClick={handleSaveLabel}
                  className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingLabel(false); setLabel(relationship.client_label) }}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-primary-900">{relationship.client_label}</h1>
                <button
                  onClick={() => setEditingLabel(true)}
                  className="text-primary-400 hover:text-primary-600"
                  title="Edit name"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-primary-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
              Supervisee
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              relationship.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-primary-100 text-primary-500'
            }`}>
              {relationship.status === 'active' ? '● Active' : '○ Ended'}
            </span>
            <span>Since {new Date(relationship.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {relationship.status === 'active' ? (
            <button
              onClick={handleEndSupervision}
              className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 transition-colors"
            >
              End supervision
            </button>
          ) : (
            <button
              onClick={() => reactivateSupervisee(relationship.id)}
              className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900"
            >
              Reactivate
            </button>
          )}
        </div>
      </div>

      {/* Pseudonymisation reminder */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-800">Client confidentiality reminder</p>
            <p className="mt-1 text-xs text-indigo-600">
              When completing supervision worksheets, use case codes when referring to clients.
              Never include identifiable client information in supervision submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Copied link banner */}
      {copiedToken && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Link copied to clipboard! Share it with your supervisee.
        </div>
      )}

      {/* Assign worksheet button */}
      {relationship.status === 'active' && !showAssign && (
        <button
          onClick={() => {
            if (!canAssign) {
              setAssignError(`Your plan is limited to ${maxActiveAssignments} active assignments. Upgrade for unlimited.`)
              return
            }
            setShowAssign(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Assign supervision worksheet
        </button>
      )}

      {assignError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {assignError}
          {assignError.includes('Upgrade') && (
            <Link href="/pricing" className="ml-2 font-medium underline underline-offset-2">
              View plans
            </Link>
          )}
        </div>
      )}

      {/* Assign workflow */}
      {showAssign && (
        <div className="rounded-2xl border border-primary-200 bg-surface p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-primary-900">Assign a supervision worksheet</h3>

          {/* Worksheet picker — grouped by type */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Worksheet</label>
            <select
              value={selectedWorksheet}
              onChange={(e) => setSelectedWorksheet(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            >
              <option value="">Choose a worksheet…</option>
              {supervisionWorksheets.length > 0 && (
                <optgroup label="Supervision Tools">
                  {supervisionWorksheets.map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </optgroup>
              )}
              {customWorksheets.length > 0 && (
                <optgroup label="My Custom Tools">
                  {customWorksheets.map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </optgroup>
              )}
              {otherCurated.length > 0 && (
                <optgroup label="Other Curated Tools">
                  {otherCurated.map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Due date <span className="text-primary-400">(optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Link expires in
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAssign}
              disabled={assignLoading || !selectedWorksheet}
              className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 disabled:opacity-50 transition-colors"
            >
              {assignLoading ? (
                'Generating link…'
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                  </svg>
                  Assign & copy link
                </>
              )}
            </button>
            <button
              onClick={() => { setShowAssign(false); setAssignError(null) }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Supervisee Data Portal link */}
      {relationship.client_portal_token && (
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-primary-800">Supervisee Data Portal</h3>
          <p className="mt-1 text-xs text-primary-500">
            Share this link so {relationship.client_label} can view their worksheets, download PDFs, or delete their data.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-600">
              {appUrl}/client/{relationship.client_portal_token}
            </code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(`${appUrl}/client/${relationship.client_portal_token}`)
                setCopiedPortalLink(true)
                setTimeout(() => setCopiedPortalLink(false), 3000)
              }}
              className="shrink-0 rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              {copiedPortalLink ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* GDPR Erasure */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Permanently Delete Supervisee Data</h3>
            <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
              This will permanently and irreversibly delete all supervision worksheets, responses, and assignment
              data for this supervisee. Audit records of the deletion will be retained.
            </p>
          </div>
          {!showGdprConfirm ? (
            <button
              onClick={() => setShowGdprConfirm(true)}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Delete all data
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleGdprErase}
                disabled={gdprLoading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {gdprLoading ? 'Deleting...' : 'Confirm permanent deletion'}
              </button>
              <button
                onClick={() => setShowGdprConfirm(false)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assignments list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-primary-900">
          Supervision worksheets ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-200 p-6 text-center">
            <p className="text-sm text-primary-500">No worksheets assigned yet. Assign a supervision worksheet to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const worksheet = worksheetMap.get(a.worksheet_id)
              const response = responseMap.get(a.id)
              const expired = isExpired(a)
              const isViewing = viewingResponse === a.id

              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-primary-800 truncate">
                          {worksheet?.title || 'Unknown worksheet'}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColors[a.status]}`}>
                          {statusLabels[a.status]}
                        </span>
                        {expired && a.status === 'assigned' && (
                          <span className="shrink-0 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-primary-400">
                        <span>Assigned {new Date(a.assigned_at).toLocaleDateString('en-GB')}</span>
                        {a.due_date && <span>Due {new Date(a.due_date).toLocaleDateString('en-GB')}</span>}
                        <span>Expires {new Date(a.expires_at).toLocaleDateString('en-GB')}</span>
                        {a.pdf_downloaded_at && (
                          <span>PDF downloaded {new Date(a.pdf_downloaded_at).toLocaleDateString('en-GB')}</span>
                        )}
                        {a.withdrawn_at && (
                          <span className="text-red-500">Withdrawn {new Date(a.withdrawn_at).toLocaleDateString('en-GB')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Share link */}
                      {!expired && (a.status === 'assigned' || a.status === 'in_progress') && (
                        <button
                          onClick={() => handleShareLink(a.token, a.worksheet_id, a.due_date)}
                          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-1"
                          title="Share link"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          Share
                        </button>
                      )}

                      {/* View response */}
                      {(a.status === 'completed' || a.status === 'reviewed' || a.status === 'in_progress') && response && (
                        <button
                          onClick={() => setViewingResponse(isViewing ? null : a.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                            isViewing
                              ? 'bg-primary-800 text-white dark:bg-primary-800 dark:text-primary-50'
                              : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                          }`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {isViewing ? 'Hide' : 'View response'}
                        </button>
                      )}

                      {/* Mark as reviewed */}
                      {a.status === 'completed' && (
                        <button
                          onClick={() => markSupervisionReviewed(a.id)}
                          className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Mark reviewed
                        </button>
                      )}

                      {/* Lock */}
                      {a.status === 'completed' && !a.locked_at && (
                        <button
                          onClick={() => lockSupervisionAssignment(a.id)}
                          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors"
                          title="Lock to prevent further edits"
                        >
                          Lock
                        </button>
                      )}

                      {/* Mark as completed (paper) — shown when supervisee downloaded PDF */}
                      {a.status === 'pdf_downloaded' && (
                        <button
                          onClick={() => markSupervisionPaperCompleted(a.id)}
                          className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Mark completed (paper)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded response view */}
                  {isViewing && response && worksheet && (
                    <div className="border-t border-primary-100 bg-primary-50/50 p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm text-primary-500">
                          {response.completed_at ? (
                            <span>Completed {new Date(response.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span>Started {new Date(response.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — in progress</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-surface p-6">
                        <MultiEntryViewer
                          schema={worksheet.schema}
                          responseData={response.response_data as Record<string, unknown>}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Share modal */}
      <ShareModal
        open={!!shareModal}
        onClose={() => setShareModal(null)}
        homeworkUrl={shareModal?.url || ''}
        worksheetTitle={shareModal?.title || ''}
        clientLabel={relationship.client_label}
        dueDate={shareModal?.dueDate}
      />
    </div>
  )
}
