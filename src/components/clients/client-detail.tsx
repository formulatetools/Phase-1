'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
  SharedResource,
  WorkspaceTemplate,
  SubscriptionTier,
  PlanQueue,
  PlanQueueItem,
} from '@/types/database'
import { QueuePanel } from '@/components/clients/queue-panel'
import {
  updateClientLabel,
  dischargeClient,
  reactivateClient,
  createAssignment,
  lockAssignment,
  markAsReviewed,
  markAsPaperCompleted,
  gdprErase,
  getErasureSummary,
  getPreviewUrl,
  regeneratePortalToken,
  resetClientPin,
  archiveResource,
} from '@/app/(dashboard)/clients/actions'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { MultiEntryViewer } from '@/components/worksheets/multi-entry-viewer'
import { ShareModal } from '@/components/ui/share-modal'
import { useAssign } from '@/components/providers/assign-provider'
import { useToast } from '@/hooks/use-toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'

type ClientTab = 'homework' | 'resources' | 'queue'

interface ClientDetailProps {
  relationship: TherapeuticRelationship
  assignments: WorksheetAssignment[]
  responses: WorksheetResponse[]
  worksheets: Worksheet[]
  sharedResources: SharedResource[]
  templates: WorkspaceTemplate[]
  queues: PlanQueue[]
  queueItems: PlanQueueItem[]
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

export function ClientDetail({
  relationship,
  assignments,
  responses,
  worksheets,
  sharedResources,
  templates,
  queues,
  queueItems,
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
  const [gdprStep, setGdprStep] = useState<'idle' | 'summary' | 'confirming'>('idle')
  const [gdprLoading, setGdprLoading] = useState(false)
  const [gdprSummary, setGdprSummary] = useState<{
    responses: number; assignments: number; activeAssignments: number;
    sharedResources: number; queues: number;
  } | null>(null)
  const [gdprConfirmText, setGdprConfirmText] = useState('')
  const [shareModal, setShareModal] = useState<{
    url: string
    title: string
    dueDate?: string
  } | null>(null)
  const [copiedPortalLink, setCopiedPortalLink] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [showPinResetConfirm, setShowPinResetConfirm] = useState(false)
  const [showPrefill, setShowPrefill] = useState(false)
  const [prefillValues, setPrefillValues] = useState<Record<string, unknown>>({})
  const [prefillReadonly, setPrefillReadonly] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { openAssignModal } = useAssign()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClientTab>('homework')
  const [showClientSettings, setShowClientSettings] = useState(false)

  // Compute queue badge count (remaining items across active queues)
  const queueRemainingCount = queueItems.filter(
    (i) => i.status === 'queued' && queues.some((q) => q.id === i.queue_id && q.status !== 'completed')
  ).length

  // Summary stats
  const activeAssignmentCount = assignments.filter(
    (a) => a.status === 'assigned' || a.status === 'in_progress'
  ).length
  const completedAssignmentCount = assignments.filter(
    (a) => a.status === 'completed' || a.status === 'reviewed'
  ).length

  const handleAction = useCallback(async (
    key: string,
    action: () => Promise<{ success?: boolean; error?: string }>,
    successMessage: string,
  ) => {
    setActionLoading(key)
    try {
      const result = await action()
      if (result.error) {
        toast({ type: 'error', message: result.error })
      } else {
        toast({ type: 'success', message: successMessage })
      }
    } catch {
      toast({ type: 'error', message: 'Something went wrong' })
    } finally {
      setActionLoading(null)
    }
  }, [toast])

  const canAssign = maxActiveAssignments === Infinity || totalActiveAssignments < maxActiveAssignments

  const worksheetMap = useMemo(() => new Map(worksheets.map((w) => [w.id, w])), [worksheets])
  const responseMap = useMemo(() => new Map(responses.map((r) => [r.assignment_id, r])), [responses])

  const handleSaveLabel = async () => {
    if (!label.trim()) return
    setActionLoading('label')
    try {
      const result = await updateClientLabel(relationship.id, label)
      if (result.error) {
        toast({ type: 'error', message: result.error })
      } else {
        toast({ type: 'success', message: 'Label updated' })
        setEditingLabel(false)
      }
    } catch {
      toast({ type: 'error', message: 'Failed to update label' })
    } finally {
      setActionLoading(null)
    }
  }

  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false)

  const handleDischarge = async () => {
    setShowDischargeConfirm(false)
    await dischargeClient(relationship.id)
  }

  const handleAssign = async () => {
    if (!selectedWorksheet) return
    setAssignLoading(true)
    setAssignError(null)

    // Build prefill data if therapist filled in any fields
    const prefillData = showPrefill && Object.keys(prefillValues).length > 0
      ? { fields: prefillValues, readonly: prefillReadonly }
      : undefined

    const result = await createAssignment(
      relationship.id,
      selectedWorksheet,
      dueDate || undefined,
      expiresInDays,
      prefillData
    )

    if (result.error) {
      setAssignError(result.error)
    } else if (result.token) {
      const link = `${appUrl}/hw/${result.token}`
      const ws = worksheetMap.get(selectedWorksheet)

      // Show share modal with link, QR, and share options
      setShareModal({
        url: link,
        title: ws?.title || 'Worksheet',
        dueDate: dueDate || undefined,
      })

      // Also copy to clipboard automatically
      try { await navigator.clipboard.writeText(link) } catch { /* clipboard unavailable */ }
      setCopiedToken(result.token)
      setShowAssign(false)
      setSelectedWorksheet('')
      setDueDate('')
      setExpiresInDays(7)
      setShowPrefill(false)
      setPrefillValues({})
      setPrefillReadonly(true)
      setTimeout(() => setCopiedToken(null), 5000)
    }
    setAssignLoading(false)
  }

  const handleCopyLink = async (token: string) => {
    const link = `${appUrl}/hw/${token}`
    try { await navigator.clipboard.writeText(link) } catch { /* clipboard unavailable */ }
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 3000)
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

  const handleGdprShowSummary = async () => {
    setGdprLoading(true)
    const result = await getErasureSummary(relationship.id)
    if ('error' in result) {
      toast({ type: 'error', message: result.error || 'Failed to fetch summary' })
      setGdprLoading(false)
      return
    }
    setGdprSummary(result)
    setGdprStep('summary')
    setGdprLoading(false)
  }

  const handleGdprErase = async () => {
    setGdprStep('confirming')
    setGdprLoading(true)
    const result = await gdprErase(relationship.id)
    if (result.success) {
      toast({ type: 'success', message: 'Client data permanently deleted.' })
      router.push('/clients')
    } else {
      toast({ type: 'error', message: result.error || 'Failed to delete client data' })
      setGdprLoading(false)
      setGdprStep('idle')
      setGdprConfirmText('')
    }
  }

  const isExpired = (a: WorksheetAssignment) => new Date(a.expires_at) < new Date()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/clients" className="text-sm text-primary-400 hover:text-primary-600 transition-colors">
            ← Back to clients
          </Link>
          <div className="mt-2 flex items-center gap-3">
            {editingLabel ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-lg border border-primary-200 px-3 py-1.5 text-base font-bold focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none sm:w-auto sm:text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                  autoFocus
                />
                <button
                  onClick={handleSaveLabel}
                  disabled={actionLoading === 'label'}
                  className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 disabled:opacity-50"
                >
                  {actionLoading === 'label' ? 'Saving…' : 'Save'}
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
                  aria-label="Edit label"
                  title="Edit label"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-primary-500">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              relationship.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-primary-100 text-primary-500'
            }`}>
              {relationship.status === 'active' ? '● Active' : '○ Discharged'}
            </span>
            <span>Since {new Date(relationship.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {relationship.status === 'active' ? (
            <button
              onClick={() => setShowDischargeConfirm(true)}
              className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 transition-colors"
            >
              Discharge
            </button>
          ) : (
            <button
              onClick={() => handleAction('reactivate', () => reactivateClient(relationship.id), 'Client reactivated')}
              disabled={actionLoading === 'reactivate'}
              className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 disabled:opacity-50"
            >
              {actionLoading === 'reactivate' ? 'Reactivating…' : 'Reactivate'}
            </button>
          )}
        </div>
      </div>

      {/* Copied link banner */}
      {copiedToken && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Homework link copied to clipboard! Share it with your client.
        </div>
      )}

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <span className="tabular-nums">{activeAssignmentCount}</span> active
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-300">
          <span className="tabular-nums">{completedAssignmentCount}</span> completed
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-dark dark:bg-brand/20">
          <span className="tabular-nums">{sharedResources.length}</span> resource{sharedResources.length !== 1 ? 's' : ''}
        </span>
        {queueRemainingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <span className="tabular-nums">{queueRemainingCount}</span> queued
          </span>
        )}
      </div>

      {/* Action buttons */}
      {relationship.status === 'active' && !showAssign && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (!canAssign) {
                setAssignError(`Free plan is limited to ${maxActiveAssignments} active assignments. Upgrade for unlimited.`)
                return
              }
              setShowAssign(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Assign homework
          </button>
          <button
            onClick={() => openAssignModal({ clientId: relationship.id, tab: 'resource' })}
            className="flex items-center gap-2 rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
            </svg>
            Assign resource
          </button>
          {templates.length > 0 && (
            <button
              onClick={() => openAssignModal({ clientId: relationship.id, tab: 'template' })}
              className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM2.25 16.875c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-2.25z" />
              </svg>
              Apply homework plan
            </button>
          )}
        </div>
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
          <h3 className="text-lg font-semibold text-primary-900">Assign a worksheet</h3>

          {/* Worksheet picker */}
          <div>
            <label htmlFor="assign-worksheet" className="block text-sm font-medium text-primary-700 mb-1">Worksheet</label>
            <select
              id="assign-worksheet"
              value={selectedWorksheet}
              onChange={(e) => setSelectedWorksheet(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            >
              <option value="">Choose a worksheet…</option>
              {(() => {
                const custom = worksheets.filter((w) => !w.is_curated)
                const curated = worksheets.filter((w) => w.is_curated)
                return (
                  <>
                    {custom.length > 0 && (
                      <optgroup label="My Custom Tools">
                        {custom.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Curated Library">
                      {curated.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.title}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )
              })()}
            </select>
          </div>

          {/* Pre-fill fields (collapsible) */}
          {selectedWorksheet && (
            <div className="rounded-xl border border-primary-100 overflow-hidden">
              <button
                onClick={() => {
                  setShowPrefill(!showPrefill)
                  if (!showPrefill) setPrefillValues({})
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-25 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span className="font-medium">Pre-fill session notes</span>
                  <span className="text-xs text-primary-400">(optional)</span>
                </span>
                <svg className={`h-4 w-4 transition-transform ${showPrefill ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showPrefill && (() => {
                const ws = worksheetMap.get(selectedWorksheet)
                if (!ws?.schema) return null
                return (
                  <div className="border-t border-primary-100 p-4 space-y-3">
                    <p className="text-xs text-primary-400">
                      Fill in any fields you&apos;d like your client to see pre-populated.
                    </p>
                    <div className="max-h-80 overflow-y-auto rounded-lg border border-primary-100 bg-primary-25 p-3">
                      <WorksheetRenderer
                        schema={ws.schema}
                        onValuesChange={(v) => setPrefillValues(v)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={prefillReadonly}
                        onChange={(e) => setPrefillReadonly(e.target.checked)}
                        className="rounded border-primary-300 text-brand focus:ring-brand"
                      />
                      <span className="text-primary-600">
                        Lock pre-filled fields <span className="text-primary-400">(client can view but not edit)</span>
                      </span>
                    </label>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Due date */}
            <div>
              <label htmlFor="assign-due-date" className="block text-sm font-medium text-primary-700 mb-1">
                Due date <span className="text-primary-400">(optional)</span>
              </label>
              <input
                id="assign-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              />
            </div>

            {/* Expiry */}
            <div>
              <label htmlFor="assign-expires" className="block text-sm font-medium text-primary-700 mb-1">
                Link expires in
              </label>
              <select
                id="assign-expires"
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

      {/* Tab bar */}
      <div className="flex rounded-lg border border-primary-200 bg-primary-50 p-0.5 dark:border-primary-700 dark:bg-primary-800" role="tablist" aria-label="Client content">
        {([
          { key: 'homework' as const, label: 'Homework', count: assignments.length },
          { key: 'resources' as const, label: 'Resources', count: sharedResources.length },
          { key: 'queue' as const, label: 'Queue', count: queueRemainingCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-surface text-primary-900 shadow-sm dark:text-primary-100'
                : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-700 dark:text-primary-300'
                  : 'bg-primary-100/50 text-primary-400 dark:bg-primary-700/50 dark:text-primary-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Homework tab */}
      {activeTab === 'homework' && (
      <div>

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

              const borderColor =
                a.status === 'completed' || a.status === 'reviewed' ? 'border-l-green-500'
                : a.status === 'in_progress' || a.status === 'pdf_downloaded' ? 'border-l-amber-500'
                : a.status === 'withdrawn' ? 'border-l-primary-300'
                : 'border-l-blue-400'

              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden border-l-[3px] ${borderColor}`}
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
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-400">
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
                    <div className="flex flex-wrap items-center justify-end gap-1.5 ml-3 shrink-0 sm:ml-4 sm:gap-2">
                      {/* Share link */}
                      {!expired && (a.status === 'assigned' || a.status === 'in_progress') && (
                        <button
                          onClick={() => handleShareLink(a.token, a.worksheet_id, a.due_date)}
                          className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-1"
                          title="Share homework link"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      )}

                      {/* Preview as client */}
                      {(a.status === 'assigned' || a.status === 'in_progress') && (
                        <button
                          onClick={async () => {
                            setActionLoading(`preview-${a.id}`)
                            try {
                              const result = await getPreviewUrl(a.id)
                              if (result.error) {
                                toast({ type: 'error', message: result.error })
                              } else if (result.url) {
                                window.open(result.url, '_blank')
                              }
                            } catch {
                              toast({ type: 'error', message: 'Failed to generate preview' })
                            } finally {
                              setActionLoading(null)
                            }
                          }}
                          disabled={actionLoading === `preview-${a.id}`}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Preview as your client sees it"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="hidden sm:inline">{actionLoading === `preview-${a.id}` ? 'Opening…' : 'Preview'}</span>
                        </button>
                      )}

                      {/* View response */}
                      {(a.status === 'completed' || a.status === 'reviewed' || a.status === 'in_progress') && response && (
                        <button
                          onClick={() => setViewingResponse(isViewing ? null : a.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                            isViewing
                              ? 'bg-primary-800 text-white dark:bg-primary-800 dark:text-primary-50'
                              : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                          }`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="hidden sm:inline">{isViewing ? 'Hide' : 'View response'}</span>
                        </button>
                      )}

                      {/* Mark as reviewed */}
                      {a.status === 'completed' && (
                        <button
                          onClick={() => handleAction(`review-${a.id}`, () => markAsReviewed(a.id), 'Marked as reviewed')}
                          disabled={actionLoading === `review-${a.id}`}
                          className="rounded-lg bg-primary-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `review-${a.id}` ? 'Saving…' : 'Mark reviewed'}
                        </button>
                      )}

                      {/* Lock */}
                      {a.status === 'completed' && !a.locked_at && (
                        <button
                          onClick={() => handleAction(`lock-${a.id}`, () => lockAssignment(a.id), 'Assignment locked')}
                          disabled={actionLoading === `lock-${a.id}`}
                          className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          aria-label="Lock assignment"
                          title="Lock to prevent further edits"
                        >
                          {actionLoading === `lock-${a.id}` ? 'Locking…' : 'Lock'}
                        </button>
                      )}

                      {/* Mark as completed (paper) — shown when client downloaded PDF */}
                      {a.status === 'pdf_downloaded' && (
                        <button
                          onClick={() => handleAction(`paper-${a.id}`, () => markAsPaperCompleted(a.id), 'Marked as completed (paper)')}
                          disabled={actionLoading === `paper-${a.id}`}
                          className="rounded-lg bg-primary-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `paper-${a.id}` ? 'Saving…' : 'Mark completed (paper)'}
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
      )}

      {/* Resources tab */}
      {activeTab === 'resources' && (
        <div>
          {sharedResources.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-primary-200 py-10 text-center dark:border-primary-700">
              <svg className="mx-auto h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
              </svg>
              <p className="mt-3 text-sm font-medium text-primary-600 dark:text-primary-400">No shared resources</p>
              <p className="mt-1 text-xs text-primary-400 dark:text-primary-500">
                Assign a resource to share links, videos, and articles with your client.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedResources.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden border-l-[3px] border-l-brand"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                        </svg>
                        <p className="font-medium text-primary-800 truncate">
                          {r.og_title || r.title}
                        </p>
                        {r.viewed_at && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Viewed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-primary-400">
                        <span>Shared {new Date(r.shared_at).toLocaleDateString('en-GB')}</span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:underline truncate max-w-[200px]"
                          >
                            {r.og_site_name || new URL(r.url).hostname.replace(/^www\./, '')}
                          </a>
                        )}
                        {r.viewed_at && (
                          <span>Viewed {new Date(r.viewed_at).toLocaleDateString('en-GB')}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(`archive-${r.id}`, () => archiveResource(r.id), 'Resource archived')}
                      disabled={actionLoading === `archive-${r.id}`}
                      className="shrink-0 ml-3 rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50"
                      title="Archive resource"
                    >
                      {actionLoading === `archive-${r.id}` ? 'Archiving…' : 'Archive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Queue tab */}
      {activeTab === 'queue' && (
        <QueuePanel
          queues={queues}
          queueItems={queueItems}
          worksheets={worksheets}
          relationshipId={relationship.id}
        />
      )}

      {/* Client settings (collapsible) */}
      <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowClientSettings(!showClientSettings)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          aria-expanded={showClientSettings}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-semibold text-primary-700">Client settings</span>
          </div>
          <svg
            className={`h-4 w-4 text-primary-400 transition-transform duration-200 ${showClientSettings ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-200 ease-in-out"
          style={{ gridTemplateRows: showClientSettings ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="space-y-5 px-5 pb-5">

              {/* Client Portal */}
              {relationship.client_portal_token && (
                <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-primary-800">Client Portal</h3>
                      <p className="mt-1 text-xs text-primary-500">
                        {relationship.client_label}&apos;s personal workspace where they can view assignments, track progress, and manage their data.
                      </p>
                    </div>
                    {/* Portal status badge */}
                    {relationship.portal_consented_at ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                        Active
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-500">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-300" aria-hidden="true" />
                        Not yet activated
                      </span>
                    )}
                  </div>

                  {relationship.portal_consented_at && (
                    <p className="mt-2 text-[10px] text-primary-400">
                      Consented {new Date(relationship.portal_consented_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-600">
                      {appUrl}/client/{relationship.client_portal_token}
                    </code>
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(`${appUrl}/client/${relationship.client_portal_token}`) } catch { /* clipboard unavailable */ }
                        setCopiedPortalLink(true)
                        setTimeout(() => setCopiedPortalLink(false), 3000)
                      }}
                      className="shrink-0 rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      {copiedPortalLink ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>

                  {/* Regenerate link */}
                  <div className="mt-3 border-t border-primary-100 pt-3">
                    {!showRegenConfirm ? (
                      <button
                        onClick={() => setShowRegenConfirm(true)}
                        className="text-xs text-primary-400 hover:text-primary-600 transition-colors underline underline-offset-2"
                      >
                        Regenerate portal link
                      </button>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800 font-medium">
                          Regenerate this portal link?
                        </p>
                        <p className="mt-1 text-[10px] text-amber-700">
                          The current link will stop working immediately. Your client will need the new link to access their workspace. If they installed the portal as an app, they will need to reinstall it.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await handleAction(
                                'regen-portal',
                                () => regeneratePortalToken(relationship.id),
                                'Portal link regenerated. Share the new link with your client.'
                              )
                              setShowRegenConfirm(false)
                            }}
                            disabled={actionLoading === 'regen-portal'}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === 'regen-portal' ? 'Regenerating\u2026' : 'Yes, regenerate'}
                          </button>
                          <button
                            onClick={() => setShowRegenConfirm(false)}
                            className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIN protection status */}
                  {relationship.portal_pin_set_at && (
                    <div className="mt-3 border-t border-primary-100 pt-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <span className="text-xs text-primary-600">
                          PIN protection enabled
                          <span className="text-primary-400 ml-1">
                            (set {new Date(relationship.portal_pin_set_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
                          </span>
                        </span>
                      </div>
                      {!showPinResetConfirm ? (
                        <button
                          onClick={() => setShowPinResetConfirm(true)}
                          className="mt-2 text-xs text-primary-400 hover:text-primary-600 transition-colors underline underline-offset-2"
                        >
                          Reset client PIN
                        </button>
                      ) : (
                        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs text-amber-800 font-medium">
                            Reset this client&apos;s PIN?
                          </p>
                          <p className="mt-1 text-[10px] text-amber-700">
                            This will remove the PIN lock from {relationship.client_label}&apos;s workspace. They will be able to set a new PIN from their portal.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={async () => {
                                await handleAction(
                                  'reset-pin',
                                  () => resetClientPin(relationship.id),
                                  'Client PIN has been reset.'
                                )
                                setShowPinResetConfirm(false)
                              }}
                              disabled={actionLoading === 'reset-pin'}
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === 'reset-pin' ? 'Resetting\u2026' : 'Yes, reset PIN'}
                            </button>
                            <button
                              onClick={() => setShowPinResetConfirm(false)}
                              className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* GDPR Erasure section */}
              <div className="rounded-2xl border border-red-100 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Permanently Delete Client Data</h3>
                    <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                      This will permanently and irreversibly delete all worksheets, responses, and assignment
                      data for this client. Audit records of the deletion will be retained.
                    </p>
                  </div>
                  {gdprStep === 'idle' && (
                    <button
                      onClick={handleGdprShowSummary}
                      disabled={gdprLoading}
                      className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {gdprLoading ? 'Loading...' : 'Delete all data'}
                    </button>
                  )}
                </div>

                {gdprStep === 'summary' && gdprSummary && (
                  <div className="mt-4 space-y-3 border-t border-red-100 dark:border-red-900 pt-4">
                    {gdprSummary.activeAssignments > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-3 py-2">
                        <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <span className="text-xs font-medium text-red-700 dark:text-red-300">
                          {gdprSummary.activeAssignments} active assignment{gdprSummary.activeAssignments !== 1 ? 's' : ''} will be permanently deleted
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-red-600/80 dark:text-red-400/80 space-y-1">
                      <p>{gdprSummary.assignments} assignment{gdprSummary.assignments !== 1 ? 's' : ''}, {gdprSummary.responses} response{gdprSummary.responses !== 1 ? 's' : ''}</p>
                      <p>{gdprSummary.sharedResources} shared resource{gdprSummary.sharedResources !== 1 ? 's' : ''}, {gdprSummary.queues} queue{gdprSummary.queues !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                        Type <strong>{relationship.client_label}</strong> to confirm
                      </label>
                      <input
                        type="text"
                        value={gdprConfirmText}
                        onChange={(e) => setGdprConfirmText(e.target.value)}
                        placeholder={relationship.client_label}
                        className="block w-full rounded-lg border border-red-200 bg-white dark:bg-red-900/10 px-3 py-1.5 text-sm text-red-900 dark:text-red-100 placeholder-red-300 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400/30"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGdprErase}
                        disabled={gdprLoading || gdprConfirmText !== relationship.client_label}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {gdprLoading ? 'Deleting...' : 'Permanently delete all data'}
                      </button>
                      <button
                        onClick={() => { setGdprStep('idle'); setGdprConfirmText(''); setGdprSummary(null) }}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Share modal */}
      <ShareModal
        open={!!shareModal}
        onClose={() => setShareModal(null)}
        homeworkUrl={shareModal?.url || ''}
        worksheetTitle={shareModal?.title || ''}
        clientLabel={relationship.client_label}
        dueDate={shareModal?.dueDate}
        portalUrl={relationship.client_portal_token ? `${appUrl}/client/${relationship.client_portal_token}` : undefined}
      />

      <ConfirmModal
        open={showDischargeConfirm}
        title="Discharge client?"
        description="This client will be moved to the discharged list. You can reactivate them later."
        confirmLabel="Discharge"
        variant="danger"
        onConfirm={handleDischarge}
        onCancel={() => setShowDischargeConfirm(false)}
      />
    </div>
  )
}

