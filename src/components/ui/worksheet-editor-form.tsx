'use client'

import { useState } from 'react'

interface Category {
  id: string
  name: string
}

interface WorksheetEditorFormProps {
  categories: Category[]
  action: (formData: FormData) => Promise<{ error?: string } | void>
  defaultValues?: {
    title?: string
    slug?: string
    description?: string
    instructions?: string
    category_id?: string
    is_premium?: boolean
    is_published?: boolean
    tags?: string[]
    estimated_minutes?: number | null
    schema?: string
  }
}

export function WorksheetEditorForm({
  categories,
  action,
  defaultValues,
}: WorksheetEditorFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(defaultValues?.slug || '')

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    const result = await action(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-primary-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={defaultValues?.title}
            onChange={(e) => {
              if (!defaultValues?.slug) setSlug(generateSlug(e.target.value))
            }}
            className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-primary-700">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-primary-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-primary-700">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          defaultValue={defaultValues?.instructions}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-primary-700">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={defaultValues?.category_id}
            className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          >
            <option value="">Select...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="estimated_minutes" className="block text-sm font-medium text-primary-700">
            Est. Minutes
          </label>
          <input
            id="estimated_minutes"
            name="estimated_minutes"
            type="number"
            min={1}
            defaultValue={defaultValues?.estimated_minutes ?? ''}
            className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-primary-700">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            defaultValue={defaultValues?.tags?.join(', ')}
            placeholder="cognitive restructuring, CBT"
            className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-primary-700">
          <input
            type="hidden"
            name="is_premium"
            value="false"
          />
          <input
            type="checkbox"
            name="is_premium"
            value="true"
            defaultChecked={defaultValues?.is_premium ?? true}
            className="h-4 w-4 rounded border-primary-300 text-brand focus:ring-brand/30"
          />
          Premium (requires subscription)
        </label>

        <label className="flex items-center gap-2 text-sm text-primary-700">
          <input
            type="hidden"
            name="is_published"
            value="false"
          />
          <input
            type="checkbox"
            name="is_published"
            value="true"
            defaultChecked={defaultValues?.is_published ?? false}
            className="h-4 w-4 rounded border-primary-300 text-brand focus:ring-brand/30"
          />
          Published
        </label>
      </div>

      <div>
        <label htmlFor="schema" className="block text-sm font-medium text-primary-700">
          Schema (JSON)
        </label>
        <textarea
          id="schema"
          name="schema"
          rows={12}
          defaultValue={
            defaultValues?.schema ||
            JSON.stringify({ version: 1, sections: [] }, null, 2)
          }
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 font-mono text-xs text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
        <p className="mt-1 text-xs text-primary-400">
          Define worksheet structure as JSON. Supports field types: text, textarea, number, likert, checklist, date, time, select, table.
        </p>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-primary-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
      >
        {defaultValues?.title ? 'Update Worksheet' : 'Create Worksheet'}
      </button>
    </form>
  )
}
