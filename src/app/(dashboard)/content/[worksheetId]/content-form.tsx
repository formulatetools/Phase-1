'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitContent, unclaimContent } from '../actions'
import { useToast } from '@/hooks/use-toast'
import type { ContentStatus } from '@/types/database'

interface Props {
  worksheetId: string
  worksheetSlug: string
  existingContent: string
  status: ContentStatus | null
  feedback: string | null
}

export function ContentForm({ worksheetId, worksheetSlug, existingContent, status, feedback }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [content, setContent] = useState(existingContent)
  const [submitting, setSubmitting] = useState(false)

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const isValidLength = wordCount >= 150 && wordCount <= 250

  const handleSubmit = async () => {
    if (!isValidLength) {
      toast({ type: 'error', message: 'Clinical context must be 150–250 words' })
      return
    }

    setSubmitting(true)
    try {
      await submitContent(worksheetId, content)
      toast({ type: 'success', message: 'Clinical context submitted for review' })
      router.push('/dashboard')
    } catch {
      toast({ type: 'error', message: 'Failed to submit clinical context' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnclaim = async () => {
    setSubmitting(true)
    try {
      await unclaimContent(worksheetId)
      toast({ type: 'success', message: 'Worksheet unclaimed' })
      router.push('/dashboard')
    } catch {
      toast({ type: 'error', message: 'Failed to unclaim worksheet' })
    } finally {
      setSubmitting(false)
    }
  }

  // Approved — read-only with link to live worksheet
  if (status === 'approved') {
    return (
      <div className="rounded-2xl border border-green-200 bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-base font-semibold text-primary-900">Clinical Context — Approved</h2>
        </div>
        <p className="text-sm text-primary-700 whitespace-pre-wrap leading-relaxed mb-4">{existingContent}</p>
        <Link
          href={`/worksheets/${worksheetSlug}`}
          className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          View live worksheet &rarr;
        </Link>
      </div>
    )
  }

  // Submitted — read-only
  if (status === 'submitted') {
    return (
      <div className="rounded-2xl border border-blue-200 bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-base font-semibold text-primary-900">Clinical Context — Submitted</h2>
        </div>
        <p className="mb-3 text-sm text-blue-700">Your clinical context has been submitted and is awaiting admin review.</p>
        <div className="rounded-xl bg-primary-50 px-4 py-3">
          <p className="text-sm text-primary-700 whitespace-pre-wrap leading-relaxed">{existingContent}</p>
        </div>
      </div>
    )
  }

  // Claimed or rejected — editable form
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-primary-900">
        {status === 'rejected' ? 'Revise Clinical Context' : 'Write Clinical Context'}
      </h2>
      <p className="mb-5 text-sm text-primary-400">
        Write 2–3 paragraphs for qualified CBT therapists covering who this is for, when to use it, and what evidence supports it.
      </p>

      {/* Admin feedback banner for rejected */}
      {status === 'rejected' && feedback && (
        <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">Admin Feedback</p>
          <p className="text-sm text-orange-800">{feedback}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="This worksheet is designed for use with clients experiencing... It draws on evidence from... Clinicians may find it particularly useful when..."
            className="w-full rounded-lg border border-primary-200 px-4 py-3 text-sm text-primary-900 leading-relaxed focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <p className={`text-xs font-medium ${
              wordCount === 0 ? 'text-primary-400' :
              isValidLength ? 'text-green-600' :
              wordCount < 150 ? 'text-amber-600' :
              'text-red-500'
            }`}>
              {wordCount} / 150–250 words
              {wordCount > 0 && wordCount < 150 && ` (${150 - wordCount} more needed)`}
              {wordCount > 250 && ` (${wordCount - 250} over limit)`}
            </p>
            {isValidLength && (
              <p className="text-xs text-green-600">&#10003; Word count is good</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-primary-100">
          <button
            onClick={handleSubmit}
            disabled={submitting || !isValidLength}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : status === 'rejected' ? 'Resubmit Clinical Context' : 'Submit Clinical Context'}
          </button>

          {status === 'claimed' && (
            <button
              onClick={handleUnclaim}
              disabled={submitting}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Unclaim
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
