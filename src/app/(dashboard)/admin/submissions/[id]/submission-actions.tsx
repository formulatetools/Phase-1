'use client'

import { useState } from 'react'
import Link from 'next/link'
import { approveSubmission, requestChanges, rejectSubmission, publishSubmission, assignReviewer } from '../actions'
import { useToast } from '@/hooks/use-toast'

interface ReviewData {
  id: string
  reviewer_id: string
  reviewer_name: string
  assigned_at: string
  completed_at: string | null
  clinical_accuracy: string | null
  completeness: string | null
  usability: string | null
  recommendation: string | null
}

interface AvailableReviewer {
  id: string
  name: string
}

interface Props {
  worksheetId: string
  libraryStatus: string
  worksheetSlug: string
  reviews: ReviewData[]
  availableReviewers: AvailableReviewer[]
}

const ACCURACY_LABELS: Record<string, { label: string; color: string }> = {
  accurate: { label: 'Accurate', color: 'bg-green-50 text-green-700' },
  minor_issues: { label: 'Minor Issues', color: 'bg-amber-50 text-amber-700' },
  significant_concerns: { label: 'Significant Concerns', color: 'bg-red-50 text-red-600' },
}

const COMPLETENESS_LABELS: Record<string, { label: string; color: string }> = {
  complete: { label: 'Complete', color: 'bg-green-50 text-green-700' },
  missing_elements: { label: 'Missing Elements', color: 'bg-amber-50 text-amber-700' },
  incomplete: { label: 'Incomplete', color: 'bg-red-50 text-red-600' },
}

const USABILITY_LABELS: Record<string, { label: string; color: string }> = {
  ready: { label: 'Ready', color: 'bg-green-50 text-green-700' },
  needs_refinement: { label: 'Needs Refinement', color: 'bg-amber-50 text-amber-700' },
  major_issues: { label: 'Major Issues', color: 'bg-red-50 text-red-600' },
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  approve: { label: 'Approve', color: 'bg-green-50 text-green-700' },
  approve_with_edits: { label: 'Approve with Edits', color: 'bg-blue-50 text-blue-700' },
  revise_resubmit: { label: 'Revise & Resubmit', color: 'bg-orange-50 text-orange-700' },
  reject: { label: 'Reject', color: 'bg-red-50 text-red-600' },
}

export function SubmissionActions({ worksheetId, libraryStatus, worksheetSlug, reviews, availableReviewers }: Props) {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [acting, setActing] = useState(false)
  const [showFeedbackFor, setShowFeedbackFor] = useState<'changes' | 'reject' | null>(null)
  const [selectedReviewer, setSelectedReviewer] = useState('')

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

  const handleAssignReviewer = async () => {
    if (!selectedReviewer) {
      toast({ type: 'error', message: 'Please select a reviewer' })
      return
    }
    setActing(true)
    await assignReviewer(worksheetId, selectedReviewer)
    toast({ type: 'success', message: 'Reviewer assigned — email sent' })
    setSelectedReviewer('')
    setActing(false)
  }

  return (
    <>
      {/* Assign Reviewer section */}
      {['submitted', 'in_review'].includes(libraryStatus) && (
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-primary-900">Assign Reviewer</h2>

          {/* Already assigned reviewers */}
          {reviews.length > 0 && (
            <div className="mb-4 space-y-2">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between rounded-xl bg-primary-50 px-3 py-2">
                  <span className="text-sm font-medium text-primary-900">{review.reviewer_name}</span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    review.completed_at ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {review.completed_at ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Assign new reviewer */}
          {availableReviewers.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              >
                <option value="">Select reviewer...</option>
                {availableReviewers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignReviewer}
                disabled={acting || !selectedReviewer}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {acting ? '...' : 'Assign'}
              </button>
            </div>
          ) : reviews.length > 0 ? (
            <p className="text-xs text-primary-400">All available reviewers have been assigned.</p>
          ) : (
            <p className="text-xs text-primary-400">No users with the clinical reviewer role.</p>
          )}
        </div>
      )}

      {/* Reviews display */}
      {reviews.some(r => r.completed_at) && (
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-primary-900">Reviews</h2>
          <div className="space-y-4">
            {reviews.filter(r => r.completed_at).map((review) => {
              const acc = review.clinical_accuracy ? ACCURACY_LABELS[review.clinical_accuracy] : null
              const comp = review.completeness ? COMPLETENESS_LABELS[review.completeness] : null
              const usa = review.usability ? USABILITY_LABELS[review.usability] : null
              const rec = review.recommendation ? RECOMMENDATION_LABELS[review.recommendation] : null

              return (
                <div key={review.id} className="rounded-xl border border-primary-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-primary-900">{review.reviewer_name}</p>
                    <p className="text-xs text-primary-400">
                      {new Date(review.completed_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {acc && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${acc.color}`}>{acc.label}</span>}
                    {comp && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${comp.color}`}>{comp.label}</span>}
                    {usa && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${usa.color}`}>{usa.label}</span>}
                  </div>
                  {rec && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-primary-500 mb-1">Recommendation</p>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${rec.color}`}>{rec.label}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
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
    </>
  )
}
