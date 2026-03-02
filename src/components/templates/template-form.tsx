'use client'

import { useState } from 'react'
import { createTemplate, updateTemplate } from '@/app/(dashboard)/templates/actions'
import { useToast } from '@/hooks/use-toast'
import type {
  Worksheet,
  WorkspaceTemplateAssignmentSpec,
  WorkspaceTemplateResourceSpec,
} from '@/types/database'

interface TemplateFormProps {
  worksheets: Worksheet[]
  initialData?: {
    id?: string
    name: string
    description: string | null
    assignmentSpecs: WorkspaceTemplateAssignmentSpec[]
    resourceSpecs: WorkspaceTemplateResourceSpec[]
    defaultExpiresInDays: number
  }
  onSaved: () => void
  onCancel: () => void
}

export function TemplateForm({
  worksheets,
  initialData,
  onSaved,
  onCancel,
}: TemplateFormProps) {
  const isEditing = !!initialData?.id
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [defaultExpiry, setDefaultExpiry] = useState(initialData?.defaultExpiresInDays || 7)
  const [assignmentSpecs, setAssignmentSpecs] = useState<WorkspaceTemplateAssignmentSpec[]>(
    initialData?.assignmentSpecs || []
  )
  const [resourceSpecs, setResourceSpecs] = useState<WorkspaceTemplateResourceSpec[]>(
    initialData?.resourceSpecs || []
  )
  const [showAddWorksheet, setShowAddWorksheet] = useState(false)
  const [showAddResource, setShowAddResource] = useState(false)
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceNote, setResourceNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Split worksheets into groups
  const curatedWorksheets = worksheets.filter((w) => w.is_curated)
  const customWorksheets = worksheets.filter((w) => !w.is_curated)

  // Already-added worksheet IDs
  const addedIds = new Set(assignmentSpecs.map((s) => s.worksheet_id))

  const handleAddWorksheet = (worksheetId: string) => {
    if (!worksheetId || addedIds.has(worksheetId)) return
    setAssignmentSpecs((prev) => [...prev, { worksheet_id: worksheetId }])
    setShowAddWorksheet(false)
  }

  const handleRemoveWorksheet = (idx: number) => {
    setAssignmentSpecs((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleAddResource = () => {
    if (!resourceUrl.trim()) return
    try {
      new URL(resourceUrl.trim())
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setResourceSpecs((prev) => [
      ...prev,
      {
        title: resourceTitle.trim() || new URL(resourceUrl.trim()).hostname.replace(/^www\./, ''),
        url: resourceUrl.trim(),
        note: resourceNote.trim() || undefined,
      },
    ])
    setResourceUrl('')
    setResourceTitle('')
    setResourceNote('')
    setShowAddResource(false)
    setError(null)
  }

  const handleRemoveResource = (idx: number) => {
    setResourceSpecs((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        assignmentSpecs,
        resourceSpecs,
        defaultExpiresInDays: defaultExpiry,
      }

      const result = isEditing
        ? await updateTemplate(initialData!.id!, payload)
        : await createTemplate(payload)

      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        toast({
          type: 'success',
          message: isEditing ? 'Template updated' : 'Template created',
        })
        onSaved()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getWorksheetTitle = (id: string) =>
    worksheets.find((w) => w.id === id)?.title || 'Unknown worksheet'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary-200 bg-surface p-6 shadow-sm space-y-5"
    >
      <h3 className="text-lg font-semibold text-primary-900">
        {isEditing ? 'Edit template' : 'Create a template'}
      </h3>
      <p className="text-xs text-primary-500">
        Bundle worksheets and resources into a reusable starter pack you can apply to any client.
      </p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-primary-700 mb-1">
          Template name
        </label>
        <input
          id="template-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., CBT Starter Pack"
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
          maxLength={100}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="template-desc" className="block text-sm font-medium text-primary-700 mb-1">
          Description <span className="text-primary-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="template-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Core worksheets for anxiety management with grounding resources"
          rows={2}
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none resize-none"
          maxLength={300}
        />
        {description.length > 0 && (
          <p className="mt-1 text-right text-[10px] text-primary-400">{description.length}/300</p>
        )}
      </div>

      {/* Default expiry */}
      <div>
        <label htmlFor="template-expiry" className="block text-sm font-medium text-primary-700 mb-1">
          Default link expiry
        </label>
        <select
          id="template-expiry"
          value={defaultExpiry}
          onChange={(e) => setDefaultExpiry(Number(e.target.value))}
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
        >
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      {/* Worksheets to assign */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium text-primary-700">Worksheets to assign</h4>
          {assignmentSpecs.length > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
              {assignmentSpecs.length}
            </span>
          )}
        </div>

        {assignmentSpecs.length > 0 && (
          <div className="space-y-2 mb-3">
            {assignmentSpecs.map((spec, idx) => (
              <div
                key={`${spec.worksheet_id}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-primary-100 bg-primary-50/50 px-3 py-2"
              >
                <span className="text-sm text-primary-700 truncate">
                  {getWorksheetTitle(spec.worksheet_id)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveWorksheet(idx)}
                  className="shrink-0 ml-2 rounded p-1 text-primary-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Remove worksheet"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddWorksheet ? (
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => handleAddWorksheet(e.target.value)}
              defaultValue=""
              className="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            >
              <option value="" disabled>Select a worksheet…</option>
              {customWorksheets.length > 0 && (
                <optgroup label="My Custom Tools">
                  {customWorksheets.filter((w) => !addedIds.has(w.id)).map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Curated Library">
                {curatedWorksheets.filter((w) => !addedIds.has(w.id)).map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </optgroup>
            </select>
            <button
              type="button"
              onClick={() => setShowAddWorksheet(false)}
              className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-500 hover:bg-primary-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddWorksheet(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add worksheet
          </button>
        )}
      </div>

      {/* Resources to share */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium text-primary-700">Resources to share</h4>
          {resourceSpecs.length > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
              {resourceSpecs.length}
            </span>
          )}
        </div>

        {resourceSpecs.length > 0 && (
          <div className="space-y-2 mb-3">
            {resourceSpecs.map((spec, idx) => (
              <div
                key={`${spec.url}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-primary-100 bg-primary-50/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-700 truncate">{spec.title}</p>
                  <p className="text-xs text-primary-400 truncate">{spec.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveResource(idx)}
                  className="shrink-0 ml-2 rounded p-1 text-primary-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Remove resource"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddResource ? (
          <div className="space-y-3 rounded-lg border border-primary-100 bg-primary-50/30 p-3">
            <input
              type="url"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            />
            <input
              type="text"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
              placeholder="Title (optional — auto-detected from URL)"
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              maxLength={200}
            />
            <textarea
              value={resourceNote}
              onChange={(e) => setResourceNote(e.target.value)}
              placeholder="Note to client (optional)"
              rows={2}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none resize-none"
              maxLength={500}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddResource}
                className="rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddResource(false)
                  setResourceUrl('')
                  setResourceTitle('')
                  setResourceNote('')
                }}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddResource(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add resource
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEditing ? 'Update template' : 'Create template'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
