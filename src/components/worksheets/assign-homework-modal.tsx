'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  getAssignableRelationships,
  getAssignableWorksheets,
} from '@/app/(dashboard)/worksheets/assign-actions'
import { getTemplates, applyTemplate } from '@/app/(dashboard)/homework-plans/actions'
import { createAssignment, shareResource } from '@/app/(dashboard)/clients/actions'
import { createQueue } from '@/app/(dashboard)/clients/queue-actions'
import { ShareModal } from '@/components/ui/share-modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { WorkspaceTemplate, PlanQueuePushMode } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTab = 'worksheet' | 'resource' | 'template'
type TemplateStep = 'select' | 'delivery' | 'confirm' | 'result'

interface AssignHomeworkModalProps {
  open: boolean
  onClose: () => void
  preSelectedClientId?: string
  preSelectedWorksheetId?: string
  preSelectedTemplateId?: string
  initialTab?: ActiveTab
}

interface Relationship {
  id: string
  client_label: string
}

interface Worksheet {
  id: string
  title: string
  tags: string[]
  is_curated: boolean
  assignCount: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssignHomeworkModal({
  open,
  onClose,
  preSelectedClientId,
  preSelectedWorksheetId,
  preSelectedTemplateId,
  initialTab = 'worksheet',
}: AssignHomeworkModalProps) {
  const { toast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)

  // ---- Shared state ----
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedRelId, setSelectedRelId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ---- Worksheet tab state ----
  const [worksheets, setWorksheets] = useState<{ custom: Worksheet[]; library: Worksheet[] }>({
    custom: [],
    library: [],
  })
  const [selectedWorksheetId, setSelectedWorksheetId] = useState('')
  const [worksheetSearch, setWorksheetSearch] = useState('')
  const [worksheetDropdownOpen, setWorksheetDropdownOpen] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [assigning, setAssigning] = useState(false)

  // Worksheet success (ShareModal)
  const [showShare, setShowShare] = useState(false)
  const [resultToken, setResultToken] = useState('')
  const [assignedLabel, setAssignedLabel] = useState('')
  const [assignedWorksheetTitle, setAssignedWorksheetTitle] = useState('')

  // ---- Resource tab state ----
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceNote, setResourceNote] = useState('')
  const [sharingResource, setSharingResource] = useState(false)

  // ---- Template tab state ----
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateStep, setTemplateStep] = useState<TemplateStep>('select')
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [templateResult, setTemplateResult] = useState<{
    assignments: number
    resources: number
    skipped: number
    portalToken: string | null
    queued?: boolean
    queuedCount?: number
  } | null>(null)

  // ---- Delivery mode state (queue vs instant) ----
  const [deliveryMode, setDeliveryMode] = useState<'instant' | 'queue'>('instant')
  const [queuePushMode, setQueuePushMode] = useState<PlanQueuePushMode>('manual')
  const [queueIntervalDays, setQueueIntervalDays] = useState(7)
  const [pushFirstImmediately, setPushFirstImmediately] = useState(true)

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  // ---- Filtered worksheets for search ----
  const filteredWorksheets = useMemo(() => {
    const q = worksheetSearch.toLowerCase().trim()
    const filter = (list: Worksheet[]) =>
      q ? list.filter((w) => w.title.toLowerCase().includes(q)) : list
    return { custom: filter(worksheets.custom), library: filter(worksheets.library) }
  }, [worksheets, worksheetSearch])

  const selectedWorksheet = useMemo(() => {
    const all = [...worksheets.custom, ...worksheets.library]
    return all.find((w) => w.id === selectedWorksheetId)
  }, [worksheets, selectedWorksheetId])

  // ---- Resolve worksheet titles for template confirm step ----
  const getWorksheetTitle = (id: string) => {
    const all = [...worksheets.custom, ...worksheets.library]
    return all.find((w) => w.id === id)?.title || null
  }

  // =========================================================================
  // Data fetching
  // =========================================================================

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setActiveTab(initialTab)
    setSelectedRelId(preSelectedClientId || '')
    setSelectedWorksheetId(preSelectedWorksheetId || '')
    setWorksheetSearch('')
    setWorksheetDropdownOpen(false)
    setDueDate('')
    setExpiresInDays(7)
    setResourceUrl('')
    setResourceTitle('')
    setResourceNote('')
    setSelectedTemplateId(preSelectedTemplateId || null)
    setTemplateStep(preSelectedTemplateId ? 'delivery' : 'select')
    setTemplateResult(null)
    setDeliveryMode('instant')
    setQueuePushMode('manual')
    setQueueIntervalDays(7)
    setPushFirstImmediately(true)

    Promise.all([
      getAssignableRelationships('clinical'),
      getAssignableWorksheets(),
      getTemplates(),
    ]).then(([relResult, wsResult, tplResult]) => {
      if (relResult.error) {
        setError(relResult.error)
      } else {
        setRelationships(relResult.data as Relationship[])
        if (!preSelectedClientId && relResult.data.length === 1) {
          setSelectedRelId(relResult.data[0].id)
        }
      }

      if (wsResult.error) {
        setError(wsResult.error)
      } else {
        setWorksheets(wsResult.data as { custom: Worksheet[]; library: Worksheet[] })
      }

      if (tplResult.error) {
        setError(tplResult.error)
      } else {
        setTemplates(tplResult.data)
        // If a template was pre-selected but not found, fall back to select step
        if (preSelectedTemplateId && !tplResult.data.find((t: WorkspaceTemplate) => t.id === preSelectedTemplateId)) {
          setSelectedTemplateId(null)
          setTemplateStep('select')
        }
      }

      setLoading(false)
    })
  }, [open, preSelectedClientId, preSelectedWorksheetId, preSelectedTemplateId, initialTab])

  // ---- Focus trap + Escape ----
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Close worksheet dropdown on outside click
  useEffect(() => {
    if (!worksheetDropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-ws-picker]')) {
        setWorksheetDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [worksheetDropdownOpen])

  // =========================================================================
  // Handlers
  // =========================================================================

  const handleAssignWorksheet = async () => {
    if (!selectedRelId || !selectedWorksheetId) return
    setAssigning(true)
    setError(null)

    try {
      const label = relationships.find((r) => r.id === selectedRelId)?.client_label || ''
      const wsTitle = selectedWorksheet?.title || ''

      const result = await createAssignment(
        selectedRelId,
        selectedWorksheetId,
        dueDate || undefined,
        expiresInDays,
      )

      if (result.error) {
        setError(result.error)
        setAssigning(false)
        return
      }

      const token = result.token || (result.data as { token?: string })?.token
      if (token) {
        setResultToken(token)
        setAssignedLabel(label)
        setAssignedWorksheetTitle(wsTitle)
        setShowShare(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleAssignResource = async () => {
    if (!selectedRelId || !resourceUrl.trim()) return
    setError(null)

    // Validate URL
    try {
      new URL(resourceUrl.trim())
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setSharingResource(true)
    try {
      const result = await shareResource(selectedRelId, {
        title: resourceTitle.trim() || new URL(resourceUrl.trim()).hostname.replace(/^www\./, ''),
        url: resourceUrl.trim(),
        note: resourceNote.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        toast({ type: 'success', message: 'Resource assigned to client' })
        onClose()
      }
    } catch {
      setError('Failed to assign resource. Please try again.')
    } finally {
      setSharingResource(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !selectedRelId) return
    setApplyingTemplate(true)
    setError(null)

    const res = await applyTemplate(selectedTemplateId, selectedRelId)
    setApplyingTemplate(false)

    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setTemplateResult({
        assignments: res.created!.assignments,
        resources: res.created!.resources,
        skipped: res.skipped?.length || 0,
        portalToken: res.portalToken || null,
      })
      setTemplateStep('result')
    }
  }

  const handleCreateQueue = async () => {
    if (!selectedTemplateId || !selectedRelId || !selectedTemplate) return
    setApplyingTemplate(true)
    setError(null)

    const items = [
      ...selectedTemplate.assignment_specs.map((spec) => ({
        item_type: 'worksheet' as const,
        worksheet_id: spec.worksheet_id,
        expires_in_days: spec.expires_in_days ?? selectedTemplate.default_expires_in_days,
      })),
      ...selectedTemplate.resource_specs.map((spec) => ({
        item_type: 'resource' as const,
        resource_title: spec.title,
        resource_url: spec.url,
        resource_note: spec.note,
      })),
    ]

    const res = await createQueue(selectedRelId, {
      templateId: selectedTemplateId,
      name: selectedTemplate.name,
      pushMode: queuePushMode,
      intervalDays: queueIntervalDays,
      items,
      pushFirstImmediately,
    })

    setApplyingTemplate(false)

    if (res.error) {
      setError(res.error)
    } else {
      setTemplateResult({
        assignments: 0,
        resources: 0,
        skipped: 0,
        portalToken: null,
        queued: true,
        queuedCount: items.length,
      })
      setTemplateStep('result')
    }
  }

  const handleShareClose = () => {
    setShowShare(false)
    setResultToken('')
    setAssignedLabel('')
    setAssignedWorksheetTitle('')
    setSelectedWorksheetId('')
    setDueDate('')
    setExpiresInDays(7)
    onClose()
  }

  const handleCopyPortalLink = async () => {
    const url = templateResult?.portalToken
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/client/${templateResult.portalToken}`
      : null
    if (!url) return
    await navigator.clipboard.writeText(url)
    toast({ type: 'success', message: 'Portal link copied to clipboard' })
  }

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setError(null)
    // Reset template sub-flow when switching away
    if (tab !== 'template') {
      setSelectedTemplateId(null)
      setTemplateStep('select')
      setTemplateResult(null)
      setDeliveryMode('instant')
    }
  }

  // =========================================================================
  // Render gates
  // =========================================================================

  if (!open) return null

  // Show ShareModal on worksheet assignment success
  if (showShare && resultToken) {
    const homeworkUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/hw/${resultToken}`
    return (
      <ShareModal
        open
        onClose={handleShareClose}
        homeworkUrl={homeworkUrl}
        worksheetTitle={assignedWorksheetTitle}
        clientLabel={assignedLabel}
        dueDate={dueDate || undefined}
      />
    )
  }

  const hasClients = relationships.length > 0
  const hasWorksheets = worksheets.custom.length > 0 || worksheets.library.length > 0

  const finalPortalUrl = templateResult?.portalToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/client/${templateResult.portalToken}`
    : null

  const qrUrl = finalPortalUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalPortalUrl)}&format=svg`
    : null

  // =========================================================================
  // JSX
  // =========================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-hw-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-6 shadow-xl dark:border-primary-800"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-2.5 text-primary-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 id="assign-hw-title" className="text-lg font-bold text-primary-900 dark:text-primary-100">
          Assign Homework
        </h2>
        <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
          Choose a client and content to assign
        </p>

        {/* Tab bar */}
        <div className="mt-4 flex rounded-lg border border-primary-200 bg-primary-50 p-0.5 dark:border-primary-700 dark:bg-primary-800" role="tablist" aria-label="Assignment type">
          {(['worksheet', 'resource', 'template'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-surface text-primary-900 shadow-sm dark:text-primary-100'
                  : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
              }`}
            >
              {tab === 'worksheet' ? 'Worksheet' : tab === 'resource' ? 'Resource' : 'Plan'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <svg className="h-5 w-5 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Empty state — no clients */}
        {!loading && !hasClients && (
          <div className="mt-6 rounded-xl border border-dashed border-primary-200 p-6 text-center dark:border-primary-700">
            <p className="text-sm font-medium text-primary-500 dark:text-primary-400">No active clients</p>
            <p className="mt-1 text-xs text-primary-400 dark:text-primary-500">
              Add a client first to assign homework.
            </p>
            <Link
              href="/clients"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-700 dark:hover:bg-primary-600"
            >
              Go to Clients
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Main form area */}
        {!loading && hasClients && templateStep !== 'result' && (
          <div className="mt-5 space-y-4">
            {/* Client picker — shared across tabs */}
            <div>
              <label htmlFor="assign-hw-client" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                Client
              </label>
              <select
                id="assign-hw-client"
                value={selectedRelId}
                onChange={(e) => setSelectedRelId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
              >
                <option value="">Select a client...</option>
                {relationships.map((rel) => (
                  <option key={rel.id} value={rel.id}>
                    {rel.client_label}
                  </option>
                ))}
              </select>
            </div>

            {/* ============================================================= */}
            {/* WORKSHEET TAB */}
            {/* ============================================================= */}
            {activeTab === 'worksheet' && (
              <>
                {/* Searchable worksheet picker */}
                <div data-ws-picker>
                  <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Worksheet
                  </label>
                  <div className="relative mt-1">
                    {/* Selected worksheet chip / search input */}
                    {selectedWorksheet && !worksheetDropdownOpen ? (
                      <button
                        type="button"
                        onClick={() => setWorksheetDropdownOpen(true)}
                        className="flex w-full items-center justify-between rounded-lg border border-primary-200 bg-surface px-3 py-2 text-left text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                      >
                        <span className="truncate">{selectedWorksheet.title}</span>
                        <svg className="h-4 w-4 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                      </button>
                    ) : (
                      <input
                        type="text"
                        placeholder="Search worksheets..."
                        value={worksheetSearch}
                        onChange={(e) => {
                          setWorksheetSearch(e.target.value)
                          setWorksheetDropdownOpen(true)
                        }}
                        onFocus={() => setWorksheetDropdownOpen(true)}
                        className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 placeholder:text-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                      />
                    )}

                    {/* Dropdown */}
                    {worksheetDropdownOpen && (
                      <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-primary-200 bg-surface shadow-lg dark:border-primary-700">
                        {filteredWorksheets.custom.length === 0 && filteredWorksheets.library.length === 0 ? (
                          <div className="px-3 py-4 text-center text-xs text-primary-400">
                            {worksheetSearch ? 'No worksheets match your search' : 'No worksheets available'}
                          </div>
                        ) : (
                          <>
                            {filteredWorksheets.custom.length > 0 && (
                              <>
                                <div className="sticky top-0 bg-primary-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-400 dark:bg-primary-800">
                                  My Custom Tools
                                </div>
                                {filteredWorksheets.custom.map((w) => (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedWorksheetId(w.id)
                                      setWorksheetSearch('')
                                      setWorksheetDropdownOpen(false)
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-primary-800 ${
                                      selectedWorksheetId === w.id ? 'bg-brand/5 text-brand-dark' : 'text-primary-700 dark:text-primary-200'
                                    }`}
                                  >
                                    <span className="truncate">{w.title}</span>
                                    {w.assignCount > 0 && (
                                      <span className="ml-2 shrink-0 text-[10px] text-primary-400">
                                        {w.assignCount}x
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </>
                            )}
                            {filteredWorksheets.library.length > 0 && (
                              <>
                                <div className="sticky top-0 bg-primary-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-400 dark:bg-primary-800">
                                  Curated Library
                                </div>
                                {filteredWorksheets.library.map((w) => (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedWorksheetId(w.id)
                                      setWorksheetSearch('')
                                      setWorksheetDropdownOpen(false)
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-primary-800 ${
                                      selectedWorksheetId === w.id ? 'bg-brand/5 text-brand-dark' : 'text-primary-700 dark:text-primary-200'
                                    }`}
                                  >
                                    <span className="truncate">{w.title}</span>
                                    {w.assignCount > 0 && (
                                      <span className="ml-2 shrink-0 text-[10px] text-primary-400">
                                        {w.assignCount}x
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {!hasWorksheets && (
                    <p className="mt-1 text-xs text-primary-400">
                      No worksheets available.{' '}
                      <Link href="/worksheets" className="font-medium text-brand hover:text-brand-dark">
                        Browse the library
                      </Link>
                    </p>
                  )}
                </div>

                {/* Due date */}
                <div>
                  <label htmlFor="assign-hw-due" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Due date <span className="text-primary-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    id="assign-hw-due"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label htmlFor="assign-hw-expiry" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Link expires after
                  </label>
                  <select
                    id="assign-hw-expiry"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="mt-1 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                  >
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
              </>
            )}

            {/* ============================================================= */}
            {/* RESOURCE TAB */}
            {/* ============================================================= */}
            {activeTab === 'resource' && (
              <>
                <div>
                  <label htmlFor="assign-hw-url" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Link URL
                  </label>
                  <input
                    id="assign-hw-url"
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1 w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 placeholder:text-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="assign-hw-res-title" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Title <span className="text-primary-400 font-normal">(optional — auto-detected from link)</span>
                  </label>
                  <input
                    id="assign-hw-res-title"
                    type="text"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    placeholder="e.g., 5-Minute Grounding Exercise"
                    className="mt-1 w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 placeholder:text-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="assign-hw-note" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Note to client <span className="text-primary-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="assign-hw-note"
                    value={resourceNote}
                    onChange={(e) => setResourceNote(e.target.value)}
                    placeholder="e.g., Try this before bed each evening this week."
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 placeholder:text-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 resize-none dark:border-primary-700 dark:text-primary-100"
                    maxLength={500}
                  />
                  {resourceNote.length > 0 && (
                    <p className="mt-1 text-right text-[10px] text-primary-400">{resourceNote.length}/500</p>
                  )}
                </div>
              </>
            )}

            {/* ============================================================= */}
            {/* TEMPLATE TAB — Select step */}
            {/* ============================================================= */}
            {activeTab === 'template' && templateStep === 'select' && (
              <>
                <p className="text-xs text-primary-400 dark:text-primary-500 mb-3">
                  Choose a pre-built plan to assign multiple worksheets and resources at once.
                </p>
                {templates.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-primary-200 py-6 text-center dark:border-primary-700">
                    <p className="text-sm text-primary-500 dark:text-primary-400">No homework plans yet.</p>
                    <Link
                      href="/homework-plans"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
                    >
                      Create your first homework plan
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          selectedTemplateId === t.id
                            ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                            : 'border-primary-100 hover:border-primary-200 hover:bg-primary-50/50 dark:border-primary-700 dark:hover:border-primary-600'
                        }`}
                      >
                        <p className="font-medium text-primary-800 dark:text-primary-200">{t.name}</p>
                        {t.description && (
                          <p className="mt-0.5 text-xs text-primary-500 line-clamp-1">{t.description}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-primary-400">
                          <span>{t.assignment_specs.length} worksheet{t.assignment_specs.length !== 1 ? 's' : ''}</span>
                          <span>{t.resource_specs.length} resource{t.resource_specs.length !== 1 ? 's' : ''}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ============================================================= */}
            {/* TEMPLATE TAB — Delivery mode step */}
            {/* ============================================================= */}
            {activeTab === 'template' && templateStep === 'delivery' && selectedTemplate && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  How would you like to deliver this plan?
                </p>

                {/* Instant option */}
                <button
                  type="button"
                  onClick={() => setDeliveryMode('instant')}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    deliveryMode === 'instant'
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                      : 'border-primary-100 hover:border-primary-200 dark:border-primary-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      deliveryMode === 'instant' ? 'border-brand' : 'border-primary-300'
                    }`}>
                      {deliveryMode === 'instant' && (
                        <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary-800 dark:text-primary-200">Apply now (all at once)</p>
                      <p className="mt-0.5 text-xs text-primary-500">
                        Assigns all {selectedTemplate.assignment_specs.length} worksheet{selectedTemplate.assignment_specs.length !== 1 ? 's' : ''} and{' '}
                        {selectedTemplate.resource_specs.length} resource{selectedTemplate.resource_specs.length !== 1 ? 's' : ''} immediately.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Queue option */}
                <button
                  type="button"
                  onClick={() => setDeliveryMode('queue')}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    deliveryMode === 'queue'
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                      : 'border-primary-100 hover:border-primary-200 dark:border-primary-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      deliveryMode === 'queue' ? 'border-brand' : 'border-primary-300'
                    }`}>
                      {deliveryMode === 'queue' && (
                        <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary-800 dark:text-primary-200">Queue &amp; push one at a time</p>
                      <p className="mt-0.5 text-xs text-primary-500">
                        Items are added to a queue. Only the first item is assigned immediately — you control when to send each subsequent item from the client&apos;s queue panel.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Queue settings (only shown when queue is selected) */}
                {deliveryMode === 'queue' && (
                  <div className="ml-8 space-y-3 rounded-xl border border-primary-100 bg-primary-50/50 p-4 dark:border-primary-700 dark:bg-primary-800/30">
                    <div>
                      <label className="block text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Push mode</label>
                      <select
                        value={queuePushMode}
                        onChange={(e) => setQueuePushMode(e.target.value as PlanQueuePushMode)}
                        className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                      >
                        <option value="manual">Manual only</option>
                        <option value="time_based">Auto-push every N days</option>
                        <option value="completion_based">Auto-push when homework completed</option>
                        <option value="both">Both (time-based + completion)</option>
                      </select>
                    </div>

                    {(queuePushMode === 'time_based' || queuePushMode === 'both') && (
                      <div>
                        <label className="block text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                          Push interval
                        </label>
                        <select
                          value={queueIntervalDays}
                          onChange={(e) => setQueueIntervalDays(Number(e.target.value))}
                          className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
                        >
                          <option value={3}>Every 3 days</option>
                          <option value={7}>Every 7 days</option>
                          <option value={14}>Every 14 days</option>
                          <option value={30}>Every 30 days</option>
                        </select>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={pushFirstImmediately}
                        onChange={(e) => setPushFirstImmediately(e.target.checked)}
                        className="rounded border-primary-300 text-brand focus:ring-brand"
                      />
                      <span className="text-primary-600 dark:text-primary-400">Push first item immediately</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TEMPLATE TAB — Confirm step */}
            {/* ============================================================= */}
            {activeTab === 'template' && templateStep === 'confirm' && selectedTemplate && (
              <div className="space-y-4">
                <p className="text-sm text-primary-500 dark:text-primary-400">
                  The following will be created for{' '}
                  <span className="font-medium text-primary-700 dark:text-primary-200">
                    {relationships.find((r) => r.id === selectedRelId)?.client_label || 'this client'}
                  </span>:
                </p>

                {selectedTemplate.assignment_specs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-1.5">
                      Worksheets ({selectedTemplate.assignment_specs.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedTemplate.assignment_specs.map((spec, idx) => {
                        const title = getWorksheetTitle(spec.worksheet_id)
                        return (
                          <div
                            key={`${spec.worksheet_id}-${idx}`}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                              title
                                ? 'bg-primary-50/50 text-primary-700 dark:bg-primary-800/50 dark:text-primary-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                            }`}
                          >
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            {title || <span className="italic">Unavailable — will be skipped</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedTemplate.resource_specs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-1.5">
                      Resources ({selectedTemplate.resource_specs.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedTemplate.resource_specs.map((spec, idx) => (
                        <div
                          key={`${spec.url}-${idx}`}
                          className="flex items-center gap-2 rounded-lg bg-primary-50/50 px-3 py-1.5 text-sm text-primary-700 dark:bg-primary-800/50 dark:text-primary-300"
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                          </svg>
                          <span className="truncate">{spec.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>
            )}

            {/* Submit buttons — per tab */}
            {activeTab === 'worksheet' && (
              <Button
                onClick={handleAssignWorksheet}
                disabled={!selectedRelId || !selectedWorksheetId || assigning}
                className="w-full"
              >
                {assigning ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Assign Homework
                  </>
                )}
              </Button>
            )}

            {activeTab === 'resource' && (
              <Button
                onClick={handleAssignResource}
                disabled={!selectedRelId || !resourceUrl.trim() || sharingResource}
                className="w-full"
              >
                {sharingResource ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                    </svg>
                    Assign Resource
                  </>
                )}
              </Button>
            )}

            {activeTab === 'template' && templateStep === 'select' && templates.length > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (selectedTemplateId && selectedRelId) {
                      setError(null)
                      setTemplateStep('delivery')
                    }
                  }}
                  disabled={!selectedTemplateId || !selectedRelId}
                  className="flex-1"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
              </div>
            )}

            {activeTab === 'template' && templateStep === 'delivery' && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setError(null)
                    setTemplateStep('confirm')
                  }}
                  className="flex-1"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
                <button
                  onClick={() => {
                    setError(null)
                    if (preSelectedTemplateId) {
                      onClose()
                    } else {
                      setTemplateStep('select')
                    }
                  }}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-800"
                >
                  {preSelectedTemplateId ? 'Cancel' : 'Back'}
                </button>
              </div>
            )}

            {activeTab === 'template' && templateStep === 'confirm' && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={deliveryMode === 'queue' ? handleCreateQueue : handleApplyTemplate}
                  disabled={applyingTemplate}
                  className="flex-1"
                >
                  {applyingTemplate ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {deliveryMode === 'queue' ? 'Creating queue...' : 'Applying...'}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {deliveryMode === 'queue' ? 'Create Queue' : 'Apply Plan'}
                    </>
                  )}
                </Button>
                <button
                  onClick={() => {
                    setError(null)
                    setTemplateStep('delivery')
                  }}
                  disabled={applyingTemplate}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-800"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TEMPLATE TAB — Result step */}
        {/* ================================================================= */}
        {!loading && activeTab === 'template' && templateStep === 'result' && templateResult && (
          <div className="mt-5">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-primary-900 dark:text-primary-100">
                {templateResult.queued ? 'Queue created' : 'Homework plan applied'}
              </h3>
              <p className="mt-2 text-sm text-primary-500">
                {templateResult.queued ? (
                  <span>
                    Queued {templateResult.queuedCount} item{templateResult.queuedCount !== 1 ? 's' : ''} for{' '}
                    {relationships.find((r) => r.id === selectedRelId)?.client_label || 'this client'}.
                    {pushFirstImmediately && ' The first item has been pushed.'}
                    {' '}Manage the queue from the client&apos;s Queue tab.
                  </span>
                ) : (
                  <>
                    {templateResult.assignments > 0 && (
                      <span>Created {templateResult.assignments} assignment{templateResult.assignments !== 1 ? 's' : ''}</span>
                    )}
                    {templateResult.assignments > 0 && templateResult.resources > 0 && <span> and </span>}
                    {templateResult.resources > 0 && (
                      <span>assigned {templateResult.resources} resource{templateResult.resources !== 1 ? 's' : ''}</span>
                    )}
                    <span> for {relationships.find((r) => r.id === selectedRelId)?.client_label || 'this client'}.</span>
                  </>
                )}
              </p>

              {templateResult.skipped > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  {templateResult.skipped} worksheet{templateResult.skipped !== 1 ? 's were' : ' was'} skipped because{' '}
                  {templateResult.skipped !== 1 ? 'they are' : 'it is'} no longer available.
                </div>
              )}
            </div>

            {/* Share portal link */}
            {finalPortalUrl && (
              <div className="mt-5 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-primary-400">
                  Share with client
                </h4>

                <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 dark:border-primary-700 dark:bg-primary-800">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-mono text-primary-700 dark:text-primary-300">{finalPortalUrl}</p>
                    </div>
                    <button
                      onClick={handleCopyPortalLink}
                      className="shrink-0 rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                    >
                      Copy link
                    </button>
                  </div>
                </div>

                {qrUrl && (
                  <div className="flex flex-col items-center rounded-xl border border-primary-100 bg-surface p-4 dark:border-primary-700">
                    <img
                      src={qrUrl}
                      alt="QR code for client portal"
                      width={120}
                      height={120}
                      className="max-w-full rounded-lg"
                    />
                    <p className="mt-2 text-xs text-primary-400">Scan to open on a phone or tablet</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-primary-800 px-6 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
