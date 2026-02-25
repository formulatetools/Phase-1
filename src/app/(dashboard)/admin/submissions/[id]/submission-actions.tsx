'use client'

import { useState } from 'react'
import Link from 'next/link'
import { approveSubmission, requestChanges, rejectSubmission, publishSubmission } from '../actions'
import { useToast } from '@/hooks/use-toast'

interface Props {
  worksheetId: string
  libraryStatus: string
  worksheetSlug: string
}

export function SubmissionActions({ worksheetId, libraryStatus, worksheetSlug }: Props) {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [acting, setActing] = useState(false)
  const [showFeedbackFor, setShowFeedbackFor] = useState<'changes' | 'reject' | null>(null)

  const handleApprove = async () => {
    setActing(true)
    await approveSubmission(worksheetId)
    toast({ type: 'success', message: 'Submission approved' })
    setActing(false)
  }

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast({ type: 'error', message: 'Please provide feedback' })
      return
    }
    setActing(true)
    await requestChanges(worksheetId, feedback)
    toast({ type: 'success', message: 'Changes requested — contributor has been emailed' })
    setFeedback('')
    setShowFeedbackFor(null)
    setActing(false)
  }

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({ type: 'error', message: 'Please provide a reason for rejection' })
      return
    }
    setActing(true)
    await rejectSubmission(worksheetId, feedback)
    toast({ type: 'success', message: 'Submission rejected — contributor has been emailed' })
    setFeedback('')
    setShowFeedbackFor(null)
    setActing(false)
  }

  const handlePublish = async () => {
    setActing(true)
    await publishSubmission(worksheetId)
    toast({ type: 'success', message: 'Worksheet published to the library!' })
    setActing(false)
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-primary-900">Actions</h2>

      {/* Published state */}
      {libraryStatus === 'published' && (
        <div className="space-y-3">
          <p className="text-sm text-green-700">This worksheet is live in the library.</p>
          <Link
            href={`/worksheets/${worksheetSlug}`}
            className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            View live worksheet &rarr;
          </Link>
        </div>
      )}

      {/* Rejected state */}
      {libraryStatus === 'rejected' && (
        <p className="text-sm text-red-600">This submission has been rejected.</p>
      )}

      {/* Changes requested state */}
      {libraryStatus === 'changes_requested' && (
        <p className="text-sm text-orange-700">Waiting for the contributor to make changes and resubmit.</p>
      )}

      {/* Actionable states */}
      {['submitted', 'in_review'].includes(libraryStatus) && (
        <div className="space-y-3">
          {/* Feedback input (shared for changes/reject) */}
          {showFeedbackFor && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-primary-700">
                {showFeedbackFor === 'changes' ? 'What changes are needed?' : 'Reason for rejection'}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder={showFeedbackFor === 'changes' ? 'Describe the specific changes needed...' : 'Explain why this submission is being rejected...'}
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
              <div className="flex gap-2">
                {showFeedbackFor === 'changes' ? (
                  <button
                    onClick={handleRequestChanges}
                    disabled={acting || !feedback.trim()}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {acting ? 'Sending...' : 'Send Feedback'}
                  </button>
                ) : (
                  <button
                    onClick={handleReject}
                    disabled={acting || !feedback.trim()}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {acting ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                )}
                <button
                  onClick={() => { setShowFeedbackFor(null); setFeedback('') }}
                  disabled={acting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showFeedbackFor && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleApprove}
                disabled={acting}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {acting ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => setShowFeedbackFor('changes')}
                disabled={acting}
                className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Request Changes
              </button>
              <button
                onClick={() => setShowFeedbackFor('reject')}
                disabled={acting}
                className="w-full rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved → Publish */}
      {libraryStatus === 'approved' && (
        <div className="space-y-3">
          <p className="text-sm text-primary-600">
            This worksheet has been approved. You can publish it to make it live in the library, or request further changes.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handlePublish}
              disabled={acting}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {acting ? 'Publishing...' : 'Publish to Library'}
            </button>
            <button
              onClick={() => setShowFeedbackFor('changes')}
              disabled={acting}
              className="w-full rounded-lg bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-100 disabled:opacity-50 transition-colors"
            >
              Request More Changes
            </button>
          </div>

          {showFeedbackFor === 'changes' && (
            <div className="space-y-2 mt-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Describe the additional changes needed..."
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRequestChanges}
                  disabled={acting || !feedback.trim()}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {acting ? 'Sending...' : 'Send Feedback'}
                </button>
                <button
                  onClick={() => { setShowFeedbackFor(null); setFeedback('') }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
