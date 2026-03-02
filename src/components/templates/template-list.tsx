'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTemplate } from '@/app/(dashboard)/templates/actions'
import { TemplateForm } from '@/components/templates/template-form'
import { useToast } from '@/hooks/use-toast'
import type { Worksheet, WorkspaceTemplate } from '@/types/database'

interface TemplateListProps {
  templates: WorkspaceTemplate[]
  worksheets: Worksheet[]
  limit: number
  count: number
}

export function TemplateList({ templates, worksheets, limit, count }: TemplateListProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const atLimit = limit !== Infinity && count >= limit

  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    const result = await deleteTemplate(id)
    setDeleteLoading(false)
    setDeleteConfirmId(null)

    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Template deleted' })
      router.refresh()
    }
  }

  const getWorksheetTitle = (id: string) =>
    worksheets.find((w) => w.id === id)?.title || 'Unknown'

  // Show create form
  if (showCreate) {
    return (
      <TemplateForm
        worksheets={worksheets}
        onSaved={() => {
          setShowCreate(false)
          router.refresh()
        }}
        onCancel={() => setShowCreate(false)}
      />
    )
  }

  // Show edit form
  if (editingId) {
    const template = templates.find((t) => t.id === editingId)
    if (template) {
      return (
        <TemplateForm
          worksheets={worksheets}
          initialData={{
            id: template.id,
            name: template.name,
            description: template.description,
            assignmentSpecs: template.assignment_specs,
            resourceSpecs: template.resource_specs,
            defaultExpiresInDays: template.default_expires_in_days,
          }}
          onSaved={() => {
            setEditingId(null)
            router.refresh()
          }}
          onCancel={() => setEditingId(null)}
        />
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Create button (inline) */}
      {!atLimit && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 py-6 text-sm font-medium text-primary-500 hover:border-brand hover:text-brand transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create a template
        </button>
      )}

      {/* Template cards */}
      {templates.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-primary-800">{t.name}</h3>
              {t.description && (
                <p className="mt-1 text-sm text-primary-500 line-clamp-2">{t.description}</p>
              )}

              {/* Spec badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-600 dark:bg-primary-800/30 dark:text-primary-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {t.assignment_specs.length} worksheet{t.assignment_specs.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-600 dark:bg-primary-800/30 dark:text-primary-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                  </svg>
                  {t.resource_specs.length} resource{t.resource_specs.length !== 1 ? 's' : ''}
                </span>
                {t.times_applied > 0 && (
                  <span className="text-primary-400">
                    Applied {t.times_applied} time{t.times_applied !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Worksheet list preview */}
              {t.assignment_specs.length > 0 && (
                <div className="mt-3 text-xs text-primary-400">
                  {t.assignment_specs.slice(0, 3).map((s, i) => (
                    <span key={s.worksheet_id}>
                      {i > 0 && ' · '}
                      {getWorksheetTitle(s.worksheet_id)}
                    </span>
                  ))}
                  {t.assignment_specs.length > 3 && (
                    <span> · +{t.assignment_specs.length - 3} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setEditingId(t.id)}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                Edit
              </button>
              {deleteConfirmId === t.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleteLoading}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(t.id)}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Empty state */}
      {templates.length === 0 && !showCreate && (
        <div className="rounded-2xl border-2 border-dashed border-primary-200 py-12 text-center">
          <svg className="mx-auto h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM2.25 16.875c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-2.25z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-primary-600">No templates yet</p>
          <p className="mt-1 text-xs text-primary-400">
            Create your first template to streamline client onboarding.
          </p>
        </div>
      )}
    </div>
  )
}
