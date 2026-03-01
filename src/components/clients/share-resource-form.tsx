'use client'

import { useState } from 'react'
import { shareResource } from '@/app/(dashboard)/clients/actions'
import { useToast } from '@/hooks/use-toast'

interface ShareResourceFormProps {
  relationshipId: string
  onShared: () => void
  onCancel: () => void
}

export function ShareResourceForm({
  relationshipId,
  onShared,
  onCancel,
}: ShareResourceFormProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url.trim())
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setLoading(true)
    try {
      const result = await shareResource(relationshipId, {
        title: title.trim() || new URL(url.trim()).hostname.replace(/^www\./, ''),
        url: url.trim(),
        note: note.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        toast({ type: 'success', message: 'Resource shared with client' })
        onShared()
      }
    } catch {
      setError('Failed to share resource. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary-200 bg-surface p-6 shadow-sm space-y-4"
    >
      <h3 className="text-lg font-semibold text-primary-900">Share a resource</h3>
      <p className="text-xs text-primary-500">
        Share a helpful link with your client. It will appear in the Resources tab of their portal.
      </p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* URL */}
      <div>
        <label htmlFor="resource-url" className="block text-sm font-medium text-primary-700 mb-1">
          Link URL
        </label>
        <input
          id="resource-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
          required
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="resource-title" className="block text-sm font-medium text-primary-700 mb-1">
          Title <span className="text-primary-400 font-normal">(optional — auto-detected from link)</span>
        </label>
        <input
          id="resource-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 5-Minute Grounding Exercise"
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
          maxLength={200}
        />
      </div>

      {/* Note */}
      <div>
        <label htmlFor="resource-note" className="block text-sm font-medium text-primary-700 mb-1">
          Note to client <span className="text-primary-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="resource-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Try this before bed each evening this week."
          rows={2}
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none resize-none"
          maxLength={500}
        />
        {note.length > 0 && (
          <p className="mt-1 text-right text-[10px] text-primary-400">{note.length}/500</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors disabled:opacity-50"
        >
          {loading ? (
            'Sharing…'
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
              </svg>
              Share resource
            </>
          )}
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
