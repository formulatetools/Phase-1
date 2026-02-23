'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { WorksheetSchema, WorksheetSection } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { SectionEditor } from './section-editor'
import { createCustomWorksheet, updateCustomWorksheet } from '@/app/(dashboard)/my-tools/actions'

interface CustomWorksheetBuilderProps {
  mode: 'create' | 'edit'
  worksheetId?: string
  categories: { id: string; name: string }[]
  initialData?: {
    title: string
    description: string
    instructions: string
    category_id: string | null
    tags: string[]
    estimated_minutes: number | null
    schema: WorksheetSchema
    forked_from: string | null
  }
}

export function CustomWorksheetBuilder({
  mode,
  worksheetId,
  categories,
  initialData,
}: CustomWorksheetBuilderProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Metadata state
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id || null)
  const [tagsInput, setTagsInput] = useState((initialData?.tags || []).join(', '))
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(initialData?.estimated_minutes || null)

  // Schema state
  const [sections, setSections] = useState<WorksheetSection[]>(
    initialData?.schema?.sections || []
  )

  // Preview toggle for mobile
  const [showPreview, setShowPreview] = useState(false)

  // Build the schema object from state
  const schema: WorksheetSchema = { version: 1, sections }

  // Collect all number field IDs across all sections (for computed field sources)
  const allNumberFieldIds: { id: string; label: string }[] = []
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === 'number' || field.type === 'likert') {
        allNumberFieldIds.push({ id: field.id, label: field.label || field.id })
      }
    }
  }

  // ── Section operations ─────────────────────────────────────────────────
  const addSection = () => {
    const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setSections([...sections, { id, title: '', fields: [] }])
  }

  const updateSection = (index: number, section: WorksheetSection) => {
    const newSections = [...sections]
    newSections[index] = section
    setSections(newSections)
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const moveSection = (from: number, to: number) => {
    const newSections = [...sections]
    const [moved] = newSections.splice(from, 1)
    newSections.splice(to, 0, moved)
    setSections(newSections)
  }

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (mode === 'create') {
      const result = await createCustomWorksheet(
        title,
        description,
        instructions,
        schema,
        categoryId,
        tags,
        estimatedMinutes
      )
      if (result.error) {
        setError(result.error)
        setSaving(false)
      } else {
        router.push(`/my-tools/${result.id}`)
      }
    } else if (worksheetId) {
      const result = await updateCustomWorksheet(
        worksheetId,
        title,
        description,
        instructions,
        schema,
        categoryId,
        tags,
        estimatedMinutes
      )
      if (result.error) {
        setError(result.error)
        setSaving(false)
      } else {
        router.push(`/my-tools/${worksheetId}`)
      }
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/my-tools"
            className="rounded-lg p-1.5 text-primary-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-primary-900">
            {mode === 'create' ? 'Create Custom Tool' : 'Edit Custom Tool'}
          </h1>
          {initialData?.forked_from && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
              Customised from library
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 lg:hidden"
          >
            {showPreview ? 'Editor' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !description.trim() || sections.length === 0}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create Tool' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex gap-6">
        {/* Left: Builder */}
        <div className={`flex-1 min-w-0 ${showPreview ? 'hidden lg:block' : ''}`}>
          {/* Metadata */}
          <div className="mb-6 space-y-4 rounded-2xl border border-primary-100 bg-surface p-5">
            <div>
              <label className="text-xs font-semibold text-primary-500">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="e.g. Weekly Mood Monitor"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-500">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Brief clinical description of this tool"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-500">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="How to use this worksheet (shown to the client)"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-primary-500">Category</label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value || null)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-primary-500">Tags</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="tag1, tag2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-primary-500">Est. minutes</label>
                <input
                  type="number"
                  value={estimatedMinutes ?? ''}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : null)}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Schema builder */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-400">
              Worksheet Structure
            </h2>

            {sections.map((section, si) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={si}
                totalSections={sections.length}
                allNumberFieldIds={allNumberFieldIds}
                onUpdate={(s) => updateSection(si, s)}
                onRemove={() => removeSection(si)}
                onMoveUp={() => si > 0 && moveSection(si, si - 1)}
                onMoveDown={() => si < sections.length - 1 && moveSection(si, si + 1)}
              />
            ))}

            <button
              onClick={addSection}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-surface py-4 text-sm font-medium text-primary-400 transition-colors hover:border-brand/30 hover:text-brand"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Section
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className={`w-full lg:w-[420px] lg:shrink-0 ${showPreview ? '' : 'hidden lg:block'}`}>
          <div className="sticky top-20">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary-400">
              Live Preview
            </h2>
            <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
              {title && (
                <h3 className="mb-1 text-lg font-bold text-primary-900">{title}</h3>
              )}
              {description && (
                <p className="mb-3 text-sm text-primary-500">{description}</p>
              )}
              {instructions && (
                <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  {instructions}
                </div>
              )}
              {sections.length > 0 ? (
                <WorksheetRenderer schema={schema} readOnly={false} />
              ) : (
                <div className="py-8 text-center text-sm text-primary-300">
                  Add sections and fields to see a preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
