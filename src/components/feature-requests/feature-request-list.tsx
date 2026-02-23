'use client'

import { useState } from 'react'
import { toggleVote } from '@/app/(dashboard)/feature-requests/actions'
import type { FeatureRequest, FeatureRequestCategory } from '@/types/database'

const CATEGORY_LABELS: Record<FeatureRequestCategory, string> = {
  new_worksheet_or_tool: 'Worksheet / Tool',
  new_psychometric_measure: 'Measure',
  platform_feature: 'Platform',
  integration: 'Integration',
  other: 'Other',
}

const CATEGORY_COLORS: Record<FeatureRequestCategory, string> = {
  new_worksheet_or_tool: 'bg-brand/10 text-brand-dark',
  new_psychometric_measure: 'bg-blue-50 text-blue-700',
  platform_feature: 'bg-purple-50 text-purple-700',
  integration: 'bg-green-50 text-green-700',
  other: 'bg-primary-100 text-primary-600',
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  planned: 'Planned',
  shipped: 'Shipped',
  declined: 'Declined',
}

interface Props {
  planned: FeatureRequest[]
  underReview: FeatureRequest[]
  recentlyShipped: FeatureRequest[]
  myPendingRequests: FeatureRequest[]
  voteCounts: Record<string, number>
  userVotes: string[]
  currentUserId: string
}

export function FeatureRequestList({
  planned,
  underReview,
  recentlyShipped,
  myPendingRequests,
  voteCounts: initialCounts,
  userVotes: initialVotes,
}: Props) {
  const [localCounts, setLocalCounts] = useState(initialCounts)
  const [localVotes, setLocalVotes] = useState<Set<string>>(new Set(initialVotes))
  const [votingId, setVotingId] = useState<string | null>(null)

  const handleVote = async (id: string) => {
    setVotingId(id)
    const wasVoted = localVotes.has(id)

    // Optimistic update
    setLocalVotes((prev) => {
      const next = new Set(prev)
      if (wasVoted) next.delete(id)
      else next.add(id)
      return next
    })
    setLocalCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + (wasVoted ? -1 : 1),
    }))

    const result = await toggleVote(id)

    if (result.error) {
      // Revert
      setLocalVotes((prev) => {
        const next = new Set(prev)
        if (wasVoted) next.add(id)
        else next.delete(id)
        return next
      })
      setLocalCounts((prev) => ({
        ...prev,
        [id]: (prev[id] || 0) + (wasVoted ? 1 : -1),
      }))
    }
    setVotingId(null)
  }

  const hasAnyRequests =
    planned.length > 0 ||
    underReview.length > 0 ||
    recentlyShipped.length > 0 ||
    myPendingRequests.length > 0

  if (!hasAnyRequests) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-primary-200 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <svg className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-primary-700">No feature requests yet</p>
        <p className="mt-1 text-sm text-primary-400">Be the first to suggest something!</p>
      </div>
    )
  }

  const renderCard = (request: FeatureRequest, showStatus?: boolean) => {
    const count = localCounts[request.id] || 0
    const voted = localVotes.has(request.id)
    const isVoting = votingId === request.id

    return (
      <div
        key={request.id}
        className="flex items-start gap-3 rounded-xl border border-primary-100 bg-white p-4 shadow-sm transition-colors"
      >
        {/* Upvote button */}
        <button
          onClick={() => handleVote(request.id)}
          disabled={isVoting}
          className={`flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 transition-colors ${
            voted
              ? 'border-brand/30 bg-brand/5 text-brand'
              : 'border-primary-200 text-primary-400 hover:border-brand/20 hover:text-brand'
          } disabled:opacity-50`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
          <span className="text-xs font-semibold">{count}</span>
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-primary-800">{request.title}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[request.category]}`}>
              {CATEGORY_LABELS[request.category]}
            </span>
            {showStatus && (
              <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-500">
                {STATUS_LABELS[request.status]}
              </span>
            )}
          </div>
          {request.description && (
            <p className="mt-1 text-sm text-primary-500 line-clamp-2">{request.description}</p>
          )}
          <p className="mt-1.5 text-xs text-primary-400">
            {new Date(request.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    )
  }

  const renderSection = (
    title: string,
    requests: FeatureRequest[],
    icon: React.ReactNode,
    note?: string,
    showStatus?: boolean
  ) => {
    if (requests.length === 0) return null

    return (
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-400">
            {title}
          </h3>
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-500">
            {requests.length}
          </span>
        </div>
        {note && (
          <p className="mb-3 text-xs text-primary-400 italic">{note}</p>
        )}
        <div className="space-y-2">
          {requests.map((r) => renderCard(r, showStatus))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* User's own pending requests */}
      {renderSection(
        'My Requests',
        myPendingRequests,
        <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>,
        'Only visible to you — pending review by the team',
        true
      )}

      {/* Planned */}
      {renderSection(
        'Planned',
        planned,
        <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}

      {/* Under Review */}
      {renderSection(
        'Under Review',
        underReview,
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}

      {/* Recently Shipped */}
      {renderSection(
        'Recently Shipped',
        recentlyShipped,
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )}
    </div>
  )
}
