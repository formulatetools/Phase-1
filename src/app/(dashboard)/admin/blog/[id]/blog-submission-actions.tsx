'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateBlogPostStatus } from '../actions'
import type { BlogPostStatus } from '@/types/database'

interface BlogSubmissionActionsProps {
  postId: string
  currentStatus: string
  existingFeedback: string | null
}

export function BlogSubmissionActions({
  postId,
  currentStatus,
  existingFeedback,
}: BlogSubmissionActionsProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState(existingFeedback || '')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAction = useCallback(
    async (status: BlogPostStatus) => {
      setLoading(status)
      setError(null)

      const result = await updateBlogPostStatus(
        postId,
        status,
        status === 'changes_requested' || status === 'rejected' ? feedback : undefined
      )

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Action failed')
      }

      setLoading(null)
    },
    [postId, feedback, router]
  )

  const showActions = ['submitted', 'in_review', 'approved', 'changes_requested'].includes(currentStatus)

  if (!showActions && currentStatus !== 'published') {
    return null
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-primary-900">Admin Actions</h2>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      {currentStatus === 'published' ? (
        <p className="text-xs text-green-600">This post is live.</p>
      ) : (
        <>
          {/* Feedback textarea */}
          <div>
            <label htmlFor="admin-feedback" className="mb-1 block text-xs font-medium text-primary-600">
              Feedback for author
            </label>
            <textarea
              id="admin-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Optional feedback..."
              className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-800 placeholder:text-primary-400 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Publish */}
            <button
              type="button"
              onClick={() => handleAction('published')}
              disabled={loading !== null}
              className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading === 'published' ? 'Publishing…' : 'Publish'}
            </button>

            {/* Approve (but don't publish yet) */}
            {currentStatus !== 'approved' && (
              <button
                type="button"
                onClick={() => handleAction('approved')}
                disabled={loading !== null}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading === 'approved' ? 'Approving…' : 'Approve'}
              </button>
            )}

            {/* Request changes */}
            <button
              type="button"
              onClick={() => handleAction('changes_requested')}
              disabled={loading !== null || !feedback.trim()}
              className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {loading === 'changes_requested' ? 'Sending…' : 'Request Changes'}
            </button>

            {/* Reject */}
            <button
              type="button"
              onClick={() => handleAction('rejected')}
              disabled={loading !== null}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
