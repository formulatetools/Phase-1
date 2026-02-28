'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ResourceType } from '@/lib/utils/resource-type'
import type { WorksheetSchema } from '@/types/worksheet'
import { getAssignableRelationships } from '@/app/(dashboard)/worksheets/assign-actions'
import { createAssignment } from '@/app/(dashboard)/clients/actions'
import { createSupervisionAssignment } from '@/app/(dashboard)/supervision/actions'
import { ShareModal } from '@/components/ui/share-modal'
import { Button } from '@/components/ui/button'

interface AssignFromLibraryModalProps {
  open: boolean
  onClose: () => void
  worksheet: {
    id: string
    title: string
    tags: string[]
    schema: WorksheetSchema
  }
  resourceType: ResourceType
}

export function AssignFromLibraryModal({
  open,
  onClose,
  worksheet,
  resourceType,
}: AssignFromLibraryModalProps) {
  const isSupervision = resourceType === 'supervision'
  const recipientLabel = isSupervision ? 'supervisee' : 'client'
  const recipientLabelPlural = isSupervision ? 'supervisees' : 'clients'
  const addLink = isSupervision ? '/supervision' : '/clients'

  // State
  const [relationships, setRelationships] = useState<{ id: string; client_label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRelId, setSelectedRelId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Success state
  const [showShare, setShowShare] = useState(false)
  const [resultToken, setResultToken] = useState('')
  const [assignedLabel, setAssignedLabel] = useState('')

  // Fetch relationships when modal opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setSelectedRelId('')

    const relType = isSupervision ? 'supervision' : 'clinical'
    getAssignableRelationships(relType).then((result) => {
      if (result.error) {
        setError(result.error)
      } else {
        setRelationships(result.data as { id: string; client_label: string }[])
        if (result.data.length === 1) {
          setSelectedRelId(result.data[0].id)
        }
      }
      setLoading(false)
    })
  }, [open, isSupervision])

  const handleAssign = async () => {
    if (!selectedRelId) return
    setAssigning(true)
    setError(null)

    try {
      const label = relationships.find((r) => r.id === selectedRelId)?.client_label || ''

      let result: { error?: string; token?: string; data?: { token?: string } }

      if (isSupervision) {
        result = await createSupervisionAssignment(
          selectedRelId,
          worksheet.id,
          dueDate || undefined,
          expiresInDays
        )
      } else {
        result = await createAssignment(
          selectedRelId,
          worksheet.id,
          dueDate || undefined,
          expiresInDays
        )
      }

      if (result.error) {
        setError(result.error)
        setAssigning(false)
        return
      }

      const token = result.token || (result.data as { token?: string })?.token
      if (token) {
        setResultToken(token)
        setAssignedLabel(label)
        setShowShare(true)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleShareClose = () => {
    setShowShare(false)
    setResultToken('')
    setAssignedLabel('')
    setSelectedRelId('')
    setDueDate('')
    setExpiresInDays(7)
    onClose()
  }

  if (!open) return null

  // Show share modal on success
  if (showShare && resultToken) {
    const homeworkUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/hw/${resultToken}`
    return (
      <ShareModal
        open
        onClose={handleShareClose}
        homeworkUrl={homeworkUrl}
        worksheetTitle={worksheet.title}
        clientLabel={assignedLabel}
        dueDate={dueDate || undefined}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-labelledby="assign-title" className="relative w-full max-w-md rounded-2xl border border-primary-100 bg-surface p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close assignment form"
          className="absolute right-4 top-4 rounded-lg p-1 text-primary-400 hover:bg-primary-50 hover:text-primary-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 id="assign-title" className="text-lg font-bold text-primary-900">
          Assign to {isSupervision ? 'Supervisee' : 'Client'}
        </h2>
        <p className="mt-1 text-sm text-primary-500">
          Assign <strong>{worksheet.title}</strong> as homework
        </p>

        {/* Loading state */}
        {loading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <svg className="h-5 w-5 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Empty state — no relationships */}
        {!loading && relationships.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-primary-200 p-6 text-center">
            <p className="text-sm font-medium text-primary-500">
              No active {recipientLabelPlural}
            </p>
            <p className="mt-1 text-xs text-primary-400">
              Add a {recipientLabel} first to assign homework.
            </p>
            <Link
              href={addLink}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50"
            >
              Go to {isSupervision ? 'Supervision' : 'Clients'}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Assignment form */}
        {!loading && relationships.length > 0 && (
          <div className="mt-5 space-y-4">
            {/* Recipient picker */}
            <div>
              <label htmlFor="assign-recipient" className="block text-sm font-medium text-primary-700">
                {isSupervision ? 'Supervisee' : 'Client'}
              </label>
              <select
                id="assign-recipient"
                value={selectedRelId}
                onChange={(e) => setSelectedRelId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              >
                <option value="">Select a {recipientLabel}…</option>
                {relationships.map((rel) => (
                  <option key={rel.id} value={rel.id}>
                    {rel.client_label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label htmlFor="assign-due" className="block text-sm font-medium text-primary-700">
                Due date <span className="text-primary-400">(optional)</span>
              </label>
              <input
                type="date"
                id="assign-due"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
            </div>

            {/* Expiry */}
            <div>
              <label htmlFor="assign-expiry" className="block text-sm font-medium text-primary-700">
                Link expires after
              </label>
              <select
                id="assign-expiry"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {/* Submit */}
            <Button
              onClick={handleAssign}
              disabled={!selectedRelId || assigning}
              className="w-full"
            >
              {assigning ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Assigning…
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
          </div>
        )}
      </div>
    </div>
  )
}
