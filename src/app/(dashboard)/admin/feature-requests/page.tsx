import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminFeatureRequests } from '@/components/feature-requests/admin-feature-requests'
import type { FeatureRequest } from '@/types/database'

export const metadata = { title: 'Feature Requests — Admin — Formulate' }

export default async function AdminFeatureRequestsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch ALL feature requests (admin RLS gives full access)
  const { data: requests } = await supabase
    .from('feature_requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all votes for count computation
  const { data: votes } = await supabase
    .from('feature_request_votes')
    .select('feature_request_id')

  const voteCounts: Record<string, number> = {}
  for (const v of (votes || []) as { feature_request_id: string }[]) {
    voteCounts[v.feature_request_id] = (voteCounts[v.feature_request_id] || 0) + 1
  }

  // Fetch submitter profiles
  const userIds = [...new Set((requests || []).map((r: { user_id: string }) => r.user_id))]
  let userMap: Record<string, { email: string; full_name: string | null }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    userMap = Object.fromEntries(
      (profiles || []).map((p: { id: string; email: string; full_name: string | null }) => [
        p.id,
        { email: p.email, full_name: p.full_name },
      ])
    )
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Admin
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Feature Requests</h1>
        <p className="mt-1 text-primary-400">
          Review and manage feature requests from users
        </p>
      </div>

      <AdminFeatureRequests
        requests={(requests || []) as FeatureRequest[]}
        voteCounts={voteCounts}
        userMap={userMap}
      />
    </div>
  )
}
