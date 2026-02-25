'use client'

import { useState } from 'react'
import Link from 'next/link'
import { approveContent, rejectContent } from './actions'
import { useToast } from '@/hooks/use-toast'

interface ContentSubmission {
  id: string
  title: string
  slug: string
  clinical_context: string
  clinical_context_status: string
  writer_name: string
}

interface Props {
  submissions: ContentSubmission[]
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  claimed: { label: 'Claimed', className: 'bg-purple-50 text-purple-700' },
  submitted: { label: 'Pending Review', className: 'bg-blue-50 text-blue-700' },
  approved: { label: 'Approved', className: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
}

export function ContentReviewActions({ submissions }: Props) {
  const { toast } = useToast()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [acting, setActing] = useState(false)

  const handleApprove = async (worksheetId: string) => {
    setActing(true)
    try {
      const result = await approveContent(worksheetId)
      if (!result.success) {
        toast({ type: 'error', message: result.error || 'Failed to approve' })
        return
      }
      toast({ type: 'success', message: 'Clinical context approved and published' })
      setExpandedId(null)
    } catch {
      toast({ type: 'error', message: 'An unexpected error occurred' })
    } finally {
      setActing(false)
    }
  }

  const handleReject = async (worksheetId: string) => {
    if (!feedback.trim()) {
      toast({ type: 'error', message: 'Please provide feedback' })
      return
    }
    setActing(true)
    try {
      const result = await rejectContent(worksheetId, feedback)
      if (!result.success) {
        toast({ type: 'error', message: result.error || 'Failed to reject' })
        return
      }
      toast({ type: 'success', message: 'Clinical context rejected — writer has been emailed' })
      setFeedback('')
      setExpandedId(null)
    } catch {
      toast({ type: 'error', message: 'An unexpected error occurred' })
    } finally {
      setActing(false)
    }
  }

  if (submissions.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-primary-400">
        No clinical context submissions to review.
      </p>
    )
  }

  return (
    <div className="divide-y divide-primary-50">
      {submissions.map((sub) => {
        const badge = STATUS_BADGES[sub.clinical_context_status] || STATUS_BADGES.submitted
        const isExpanded = expandedId === sub.id
        const isPending = sub.clinical_context_status === 'submitted'

        return (
          <div key={sub.id}>
            <button
              onClick={() => {
                setExpandedId(isExpanded ? null : sub.id)
                setFeedback('')
              }}
              className="flex w-full items-center justify-between px-6 py-4 hover:bg-primary-50/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900">{sub.title}</p>
                <p className="mt-0.5 text-xs text-primary-400">by {sub.writer_name}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                  {badge.label}
                </span>
                <svg className={`h-4 w-4 text-primary-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="px-6 pb-5">
                {/* Clinical context preview */}
                <div className="rounded-xl bg-green-50/50 border border-green-200/50 px-4 py-3 mb-4">
                  <p className="text-xs font-medium text-green-700 mb-1">Clinical Context</p>
                  <p className="text-sm text-primary-700 whitespace-pre-wrap leading-relaxed">{sub.clinical_context}</p>
                </div>

                {/* Worksheet link */}
                <div className="mb-4">
                  <Link
                    href={`/worksheets/${sub.slug}`}
                    className="text-xs text-brand hover:text-brand-dark font-medium"
                    target="_blank"
                  >
                    View worksheet &rarr;
                  </Link>
                </div>

                {/* Action buttons (only for pending submissions) */}
                {isPending && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(sub.id)}
                        disabled={acting}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {acting ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setFeedback(feedback || ' ')}
                        disabled={acting}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>

                    {feedback && (
                      <div className="space-y-2">
                        <textarea
                          value={feedback.trim() ? feedback : ''}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                          placeholder="Explain what needs to change..."
                          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(sub.id)}
                            disabled={acting || !feedback.trim()}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            {acting ? 'Rejecting...' : 'Confirm Reject'}
                          </button>
                          <button
                            onClick={() => setFeedback('')}
                            disabled={acting}
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
            )}
          </div>
        )
      })}
    </div>
  )
}
