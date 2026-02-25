import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminTabs } from '@/components/admin/admin-tabs'
import type { ContributorProfile } from '@/types/database'

export const metadata = { title: 'Submissions — Admin — Formulate' }

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700' },
  in_review: { label: 'In Review', className: 'bg-amber-50 text-amber-700' },
  changes_requested: { label: 'Changes Requested', className: 'bg-orange-50 text-orange-700' },
  approved: { label: 'Approved', className: 'bg-green-50 text-green-700' },
  published: { label: 'Published', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const { status: filterStatus } = await searchParams
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch submissions
  let query = supabase
    .from('worksheets')
    .select('id, title, slug, library_status, submitted_at, submitted_by, suggested_category, admin_feedback')
    .not('library_status', 'is', null)
    .is('deleted_at', null)
    .order('submitted_at', { ascending: false })

  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('library_status', filterStatus)
  }

  const { data: submissions } = await query

  // Fetch contributor profiles
  const submitterIds = [...new Set((submissions || []).map((s: { submitted_by: string }) => s.submitted_by).filter(Boolean))]
  let profileMap: Record<string, { full_name: string | null; email: string; contributor_profile: ContributorProfile | null }> = {}

  if (submitterIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, contributor_profile')
      .in('id', submitterIds)

    profileMap = Object.fromEntries(
      (profiles || []).map((p: { id: string; full_name: string | null; email: string; contributor_profile: ContributorProfile | null }) => [
        p.id,
        { full_name: p.full_name, email: p.email, contributor_profile: p.contributor_profile },
      ])
    )
  }

  type Submission = {
    id: string; title: string; slug: string; library_status: string
    submitted_at: string; submitted_by: string; suggested_category: string | null
    admin_feedback: string | null
  }

  const typedSubmissions = (submissions || []) as Submission[]

  // Status filter counts
  const allCount = typedSubmissions.length
  const statusFilters = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'submitted', label: 'Submitted', count: typedSubmissions.filter(s => s.library_status === 'submitted').length },
    { key: 'in_review', label: 'In Review', count: typedSubmissions.filter(s => s.library_status === 'in_review').length },
    { key: 'approved', label: 'Approved', count: typedSubmissions.filter(s => s.library_status === 'approved').length },
    { key: 'published', label: 'Published', count: typedSubmissions.filter(s => s.library_status === 'published').length },
  ]

  const activeFilter = filterStatus || 'all'

  // Filter submissions for display
  const displaySubmissions = activeFilter === 'all'
    ? typedSubmissions
    : typedSubmissions.filter(s => s.library_status === activeFilter)

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <AdminTabs />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Submissions</h1>
        <p className="mt-1 text-primary-400">Review and manage library submissions from contributors</p>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {statusFilters.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/admin/submissions' : `/admin/submissions?status=${f.key}`}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === f.key
                ? 'bg-primary-800 text-white dark:bg-primary-200 dark:text-primary-900'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`ml-1.5 ${activeFilter === f.key ? 'text-white/70' : 'text-primary-400'}`}>
                {f.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Submissions table */}
      {displaySubmissions.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-primary-100 bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary-100 bg-primary-50/50">
                <th className="px-4 py-3 font-medium text-primary-500">Worksheet</th>
                <th className="px-4 py-3 font-medium text-primary-500">Contributor</th>
                <th className="px-4 py-3 font-medium text-primary-500">Category</th>
                <th className="px-4 py-3 font-medium text-primary-500">Status</th>
                <th className="px-4 py-3 font-medium text-primary-500">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {displaySubmissions.map((sub) => {
                const contributor = profileMap[sub.submitted_by]
                const badge = STATUS_BADGES[sub.library_status] || STATUS_BADGES.submitted
                const displayName = (contributor?.contributor_profile as ContributorProfile | null)?.display_name || contributor?.full_name || contributor?.email || 'Unknown'

                return (
                  <tr key={sub.id} className="hover:bg-primary-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        className="font-medium text-primary-900 hover:text-brand transition-colors"
                      >
                        {sub.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-primary-600">{displayName}</td>
                    <td className="px-4 py-3 text-primary-500">{sub.suggested_category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-400">
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary-100 bg-surface p-12 text-center shadow-sm">
          <p className="text-sm text-primary-500">No submissions {activeFilter !== 'all' ? `with status "${activeFilter}"` : 'yet'}</p>
        </div>
      )}
    </div>
  )
}
