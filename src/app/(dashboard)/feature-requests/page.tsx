import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { FeatureRequestForm } from '@/components/feature-requests/feature-request-form'
import { FeatureRequestList } from '@/components/feature-requests/feature-request-list'
import type { FeatureRequest, FeatureRequestVote } from '@/types/database'

export const metadata = { title: 'Feature Requests — Formulate' }

export default async function FeatureRequestsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch all visible feature requests (RLS handles visibility filtering)
  const { data: requests } = await supabase
    .from('feature_requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch votes for visible requests
  const requestIds = (requests || []).map((r: { id: string }) => r.id)
  let votes: FeatureRequestVote[] = []

  if (requestIds.length > 0) {
    const { data } = await supabase
      .from('feature_request_votes')
      .select('*')
      .in('feature_request_id', requestIds)

    votes = (data || []) as FeatureRequestVote[]
  }

  // Compute vote counts and user's own votes
  const voteCounts: Record<string, number> = {}
  const userVotes: string[] = []

  for (const vote of votes) {
    voteCounts[vote.feature_request_id] = (voteCounts[vote.feature_request_id] || 0) + 1
    if (vote.user_id === user.id) {
      userVotes.push(vote.feature_request_id)
    }
  }

  // Group requests by status
  const typedRequests = (requests || []) as FeatureRequest[]
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const myPendingRequests = typedRequests.filter(
    (r) => r.user_id === user.id && (r.status === 'submitted' || r.status === 'declined')
  )
  const planned = typedRequests.filter((r) => r.status === 'planned')
  const underReview = typedRequests.filter((r) => r.status === 'under_review')
  const recentlyShipped = typedRequests.filter(
    (r) => r.status === 'shipped' && r.shipped_at && r.shipped_at >= ninetyDaysAgo
  )

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Feature Requests</h1>
          <p className="mt-1 text-primary-400">
            Suggest new features and vote on ideas from the community
          </p>
        </div>

        {/* Submission form */}
        <FeatureRequestForm />

        {/* Grouped request lists */}
        <FeatureRequestList
          planned={planned}
          underReview={underReview}
          recentlyShipped={recentlyShipped}
          myPendingRequests={myPendingRequests}
          voteCounts={voteCounts}
          userVotes={userVotes}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
