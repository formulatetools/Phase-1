'use client'

import { useState } from 'react'
import { submitFeatureRequest } from '@/app/(dashboard)/feature-requests/actions'
import type { FeatureRequestCategory } from '@/types/database'

const CATEGORY_OPTIONS: { value: FeatureRequestCategory; label: string }[] = [
  { value: 'new_worksheet_or_tool', label: 'New worksheet or tool' },
  { value: 'new_psychometric_measure', label: 'New psychometric measure' },
  { value: 'platform_feature', label: 'Platform feature' },
  { value: 'integration', label: 'Integration' },
  { value: 'other', label: 'Other' },
]

export function FeatureRequestForm() {
  const [category, setCategory] = useState<FeatureRequestCategory>('platform_feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [currentTool, setCurrentTool] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await submitFeatureRequest(category, title, description, currentTool)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTitle('')
      setDescription('')
      setCurrentTool('')
      setCategory('platform_feature')
      setTimeout(() => setSuccess(false), 5000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-primary-900">Submit a Request</h2>
      <p className="mb-5 text-sm text-primary-400">
        Tell us what you need — we review every submission
      </p>

      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Thanks! Your request has been submitted and will be reviewed by the team.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeatureRequestCategory)}
            className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="e.g. Panic cycle formulation, WSAS measure, Dark mode"
            className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-primary-400">{title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Description <span className="text-primary-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Tell us more about what you need and how you'd use it"
            className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none resize-none"
          />
        </div>

        {/* Current tool */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            What do you currently use for this? <span className="text-primary-400">(optional)</span>
          </label>
          <input
            type="text"
            value={currentTool}
            onChange={(e) => setCurrentTool(e.target.value)}
            placeholder="e.g. Paper worksheet, Word template, another app"
            className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300 disabled:opacity-50"
        >
          {loading ? (
            'Submitting...'
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Submit Request
            </>
          )}
        </button>
      </div>
    </form>
  )
}
