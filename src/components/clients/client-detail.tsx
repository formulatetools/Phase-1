'use client'

import { useState } from 'react'
import Link from 'next/link'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
  SubscriptionTier,
} from '@/types/database'
import {
  updateClientLabel,
  dischargeClient,
  reactivateClient,
  createAssignment,
  lockAssignment,
  markAsReviewed,
  gdprErase,
} from '@/app/(dashboard)/clients/actions'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'

interface ClientDetailProps {
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
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  reviewed: 'bg-primary-100 text-primary-600',
}

const statusLabels: Record<string, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  reviewed: 'Reviewed',
}

export function ClientDetail({
  relationship,
  assignments,
  responses,
  worksheets,
  totalActiveAssignments,
  maxActiveAssignments,
  tier,
  appUrl,
}: ClientDetailProps) {
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

  const canAssign = maxActiveAssignments === Infinity || totalActiveAssignments < maxActiveAssignments

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))
  const responseMap = new Map(responses.map((r) => [r.assignment_id, r]))

  const handleSaveLabel = async () => {
    if (!label.trim()) return
    await updateClientLabel(relationship.id, label)
    setEditingLabel(false)
  }

  const handleDischarge = async () => {
    if (!confirm('Discharge this client? They can be reactivated later.')) return
    await dischargeClient(relationship.id)
  }

  const handleAssign = async () => {
    if (!selectedWorksheet) return
    setAssignLoading(true)
    setAssignError(null)

    const result = await createAssignment(
      relationship.id,
      selectedWorksheet,
      dueDate || undefined,
      expiresInDays
    )

    if (result.error) {
      setAssignError(result.error)
    } else if (result.token) {
      // Copy link to clipboard
      const link = `${appUrl}/hw/${result.token}`
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

  const handleCopyLink = async (token: string) => {
    const link = `${appUrl}/hw/${token}`
    await navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 3000)
  }

  const handleGdprErase = async () => {
    setGdprLoading(true)
    const result = await gdprErase(relationship.id)
    if (result.success) {
      window.location.href = '/clients'
    } else {
      alert(result.error || 'Failed to delete client data')
      setGdprLoading(false)
      setShowGdprConfirm(false)
    }
  }

  const isExpired = (a: WorksheetAssignment) => new Date(a.expires_at) < new Date()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm text-primary-400 hover:text-primary-600 transition-colors">
            ← Back to clients
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
                  className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900"
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
                  title="Edit label"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-primary-500">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              relationship.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-primary-100 text-primary-500'
            }`}>
              {relationship.status === 'active' ? '● Active' : '○ Discharged'}
            </span>
            <span>Since {new Date(relationship.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {relationship.status === 'active' ? (
            <button
              onClick={handleDischarge}
              className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 transition-colors"
            >
              Discharge
            </button>
          ) : (
            <button
              onClick={() => reactivateClient(relationship.id)}
              className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900"
            >
              Reactivate
            </button>
          )}
        </div>
      </div>

      {/* Copied link banner */}
      {copiedToken && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Homework link copied to clipboard! Share it with your client.
        </div>
      )}

      {/* Assign worksheet button */}
      {relationship.status === 'active' && !showAssign && (
        <button
          onClick={() => {
            if (!canAssign) {
              setAssignError(`Free plan is limited to ${maxActiveAssignments} active assignments. Upgrade for unlimited.`)
              return
            }
            setShowAssign(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Assign worksheet
        </button>
      )}

      {assignError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
        <div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-primary-900">Assign a worksheet</h3>

          {/* Worksheet picker */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Worksheet</label>
            <select
              value={selectedWorksheet}
              onChange={(e) => setSelectedWorksheet(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            >
              <option value="">Choose a worksheet…</option>
              {worksheets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due date */}
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

            {/* Expiry */}
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
              className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 disabled:opacity-50 transition-colors"
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

      {/* GDPR Erasure section */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-800">Permanently Delete Client Data</h3>
            <p className="mt-1 text-xs text-red-600/80">
              This will permanently and irreversibly delete all worksheets, responses, and assignment
              data for this client. Audit records of the deletion will be retained.
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
          Assignments ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-200 p-6 text-center">
            <p className="text-sm text-primary-500">No assignments yet. Assign a worksheet to get started.</p>
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
                  className="rounded-2xl border border-primary-100 bg-white shadow-sm overflow-hidden"
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
                          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-primary-400">
                        <span>Assigned {new Date(a.assigned_at).toLocaleDateString('en-GB')}</span>
                        {a.due_date && <span>Due {new Date(a.due_date).toLocaleDateString('en-GB')}</span>}
                        <span>Expires {new Date(a.expires_at).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Copy link */}
                      {!expired && (a.status === 'assigned' || a.status === 'in_progress') && (
                        <button
                          onClick={() => handleCopyLink(a.token)}
                          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-1"
                          title="Copy homework link"
                        >
                          {copiedToken === a.token ? (
                            <>
                              <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                              </svg>
                              Copy link
                            </>
                          )}
                        </button>
                      )}

                      {/* View response */}
                      {(a.status === 'completed' || a.status === 'reviewed' || a.status === 'in_progress') && response && (
                        <button
                          onClick={() => setViewingResponse(isViewing ? null : a.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                            isViewing
                              ? 'bg-primary-800 text-white'
                              : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                          }`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {isViewing ? 'Hide' : 'View response'}
                        </button>
                      )}

                      {/* Mark as reviewed */}
                      {a.status === 'completed' && (
                        <button
                          onClick={() => markAsReviewed(a.id)}
                          className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 transition-colors"
                        >
                          Mark reviewed
                        </button>
                      )}

                      {/* Lock */}
                      {a.status === 'completed' && !a.locked_at && (
                        <button
                          onClick={() => lockAssignment(a.id)}
                          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors"
                          title="Lock to prevent further edits"
                        >
                          Lock
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
                      <div className="rounded-xl border border-primary-200 bg-white p-6">
                        <WorksheetRenderer
                          schema={worksheet.schema}
                          readOnly={true}
                          initialValues={response.response_data as Record<string, unknown>}
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
    </div>
  )
}
