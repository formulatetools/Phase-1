import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { activityLabel, activityIcon, timeAgo, type ActivityItem } from '@/lib/utils/activity'
import { SignupChart } from '@/components/admin/signup-chart'
import { AssignmentChart } from '@/components/admin/assignment-chart'
import { PopularWorksheetsChart } from '@/components/admin/popular-worksheets-chart'

export const metadata = { title: 'Admin Dashboard — Formulate' }

/* ─── Aggregation helpers ────────────────────────────────────────────── */

function aggregateByWeek(dates: string[]): { week: string; count: number }[] {
  const buckets: Record<string, number> = {}
  for (const dateStr of dates) {
    const d = new Date(dateStr)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    buckets[key] = (buckets[key] || 0) + 1
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))
}

interface AccessLog {
  worksheet_id: string
  access_type: string
}

interface AssignmentLog {
  worksheet_id: string
}

interface WorksheetInfo {
  id: string
  title: string
  slug: string
  is_published: boolean
}

interface RankedWorksheet extends WorksheetInfo {
  views: number
  assignments: number
  exports: number
  total: number
}

function rankWorksheets(
  accessLogs: AccessLog[],
  assignmentLogs: AssignmentLog[],
  worksheets: WorksheetInfo[],
): RankedWorksheet[] {
  const stats: Record<string, { views: number; exports: number; assignments: number }> = {}

  for (const log of accessLogs) {
    if (!stats[log.worksheet_id])
      stats[log.worksheet_id] = { views: 0, exports: 0, assignments: 0 }
    if (log.access_type === 'view' || log.access_type === 'interact')
      stats[log.worksheet_id].views++
    if (log.access_type === 'export') stats[log.worksheet_id].exports++
  }

  for (const a of assignmentLogs) {
    if (!stats[a.worksheet_id])
      stats[a.worksheet_id] = { views: 0, exports: 0, assignments: 0 }
    stats[a.worksheet_id].assignments++
  }

  const wsMap = new Map(worksheets.map((w) => [w.id, w]))

  return Object.entries(stats)
    .filter(([id]) => wsMap.has(id))
    .map(([id, s]) => ({
      ...wsMap.get(id)!,
      ...s,
      total: s.views + s.exports + s.assignments,
    }))
    .sort((a, b) => b.total - a.total)
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default async function AdminPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString()

  // ── Parallel data fetches ──────────────────────────────────────────
  const [
    { count: therapistCount },
    { data: recentAuditUsers },
    { count: totalWorksheetCount },
    { count: publishedWorksheetCount },
    { count: totalAssignmentCount },
    { count: completedAssignmentCount },
    { count: exportCount },
    { data: signupDates },
    { data: accessLogs },
    { data: assignmentLogs },
    { data: worksheetDetails },
    { data: assignmentDates },
    { data: recentUsers },
    { data: activityData },
  ] = await Promise.all([
    // 1. Total therapists
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'therapist'),

    // 2. Active user IDs (last 30 days)
    supabase
      .from('audit_log')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo),

    // 3. Total worksheets
    supabase
      .from('worksheets')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),

    // 4. Published worksheets
    supabase
      .from('worksheets')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_published', true),

    // 5. Total assignments
    supabase
      .from('worksheet_assignments')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),

    // 6. Completed assignments
    supabase
      .from('worksheet_assignments')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['completed', 'reviewed']),

    // 7. Export count
    supabase
      .from('worksheet_access_log')
      .select('*', { count: 'exact', head: true })
      .eq('access_type', 'export'),

    // 8. Signup dates (last 12m)
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true }),

    // 9. All access logs
    supabase
      .from('worksheet_access_log')
      .select('worksheet_id, access_type'),

    // 10. All assignment logs
    supabase
      .from('worksheet_assignments')
      .select('worksheet_id')
      .is('deleted_at', null),

    // 11. Worksheet info
    supabase
      .from('worksheets')
      .select('id, title, slug, is_published')
      .is('deleted_at', null),

    // 12. Assignment dates (last 12m)
    supabase
      .from('worksheet_assignments')
      .select('assigned_at')
      .is('deleted_at', null)
      .gte('assigned_at', twelveMonthsAgo.toISOString())
      .order('assigned_at', { ascending: true }),

    // 13. Recent signups
    supabase
      .from('profiles')
      .select('id, email, full_name, role, subscription_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(10),

    // 14. Platform-wide activity (latest 20)
    supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // ── Computed stats ─────────────────────────────────────────────────
  const activeUsers = new Set(
    (recentAuditUsers || []).map((r: { user_id: string }) => r.user_id),
  ).size

  const completionRate =
    (totalAssignmentCount ?? 0) > 0
      ? Math.round(
          ((completedAssignmentCount ?? 0) / (totalAssignmentCount ?? 0)) *
            100,
        )
      : 0

  const signupsByWeek = aggregateByWeek(
    (signupDates || []).map((r: { created_at: string }) => r.created_at),
  )

  const assignmentsByWeek = aggregateByWeek(
    (assignmentDates || []).map((r: { assigned_at: string }) => r.assigned_at),
  )

  const ranked = rankWorksheets(
    (accessLogs || []) as AccessLog[],
    (assignmentLogs || []) as AssignmentLog[],
    (worksheetDetails || []) as WorksheetInfo[],
  )

  // Activity feed: fetch profile info for user IDs
  const activityUserIds = [
    ...new Set(
      (activityData || []).map(
        (a: { user_id: string }) => a.user_id,
      ),
    ),
  ]
  const { data: activityProfiles } = activityUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', activityUserIds)
    : { data: [] }

  const userMap: Record<string, { email: string; full_name: string | null }> =
    Object.fromEntries(
      (activityProfiles || []).map(
        (p: { id: string; email: string; full_name: string | null }) => [
          p.id,
          { email: p.email, full_name: p.full_name },
        ],
      ),
    )

  // Tier badge colours
  const tierColors: Record<string, string> = {
    free: 'bg-primary-100 text-primary-600',
    standard: 'bg-brand/10 text-brand-dark',
    professional: 'bg-brand/10 text-brand-dark',
  }
  const roleColors: Record<string, string> = {
    therapist: 'bg-brand/10 text-brand-dark',
    admin: 'bg-red-50 text-red-700',
    client: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-primary-400">
            Platform overview and analytics
          </p>
        </div>
        <Link
          href="/admin/worksheets/new"
          className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900"
        >
          New Worksheet
        </Link>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Therapists */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{therapistCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Therapists</p>
        </div>

        {/* Active Users (30d) */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{activeUsers}</p>
          <p className="mt-0.5 text-sm text-primary-400">Active (30 days)</p>
        </div>

        {/* Worksheets */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalWorksheetCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Worksheets
            <span className="text-primary-300"> · {publishedWorksheetCount ?? 0} published</span>
          </p>
        </div>

        {/* Total Assignments */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalAssignmentCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Assignments</p>
        </div>

        {/* Completion Rate */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">
            {(totalAssignmentCount ?? 0) > 0 ? `${completionRate}%` : '—'}
          </p>
          <p className="mt-0.5 text-sm text-primary-400">
            {(totalAssignmentCount ?? 0) > 0
              ? `${completedAssignmentCount ?? 0} of ${totalAssignmentCount} completed`
              : 'Completion rate'}
          </p>
        </div>

        {/* PDF Exports */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{exportCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">PDF Exports</p>
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SignupChart data={signupsByWeek} />
        <AssignmentChart data={assignmentsByWeek} />
      </div>

      <div className="mb-8">
        <PopularWorksheetsChart
          data={ranked.slice(0, 10).map((w) => ({
            title: w.title,
            views: w.views,
            assignments: w.assignments,
            exports: w.exports,
          }))}
        />
      </div>

      {/* ── Bottom row: Tables + Activity Feed ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — tables */}
        <div className="space-y-6 lg:col-span-2">
          {/* Top Worksheets Table */}
          <div className="rounded-2xl border border-primary-100 bg-white shadow-sm">
            <div className="border-b border-primary-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-primary-900">
                Top Worksheets
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-primary-50 bg-primary-50/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-primary-500">#</th>
                    <th className="px-6 py-3 font-medium text-primary-500">Title</th>
                    <th className="px-6 py-3 font-medium text-primary-500 text-right">Views</th>
                    <th className="px-6 py-3 font-medium text-primary-500 text-right">Assigns</th>
                    <th className="px-6 py-3 font-medium text-primary-500 text-right">Exports</th>
                    <th className="px-6 py-3 font-medium text-primary-500">Status</th>
                    <th className="px-6 py-3 font-medium text-primary-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50">
                  {ranked.slice(0, 15).map((ws, i) => (
                    <tr key={ws.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-6 py-3 text-primary-400">{i + 1}</td>
                      <td className="px-6 py-3 font-medium text-primary-900">
                        {ws.title}
                      </td>
                      <td className="px-6 py-3 text-right text-primary-600">
                        {ws.views}
                      </td>
                      <td className="px-6 py-3 text-right text-primary-600">
                        {ws.assignments}
                      </td>
                      <td className="px-6 py-3 text-right text-primary-600">
                        {ws.exports}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            ws.is_published
                              ? 'bg-brand/10 text-brand-dark'
                              : 'bg-primary-100 text-primary-600'
                          }`}
                        >
                          {ws.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/worksheets/${ws.slug}/edit`}
                          className="text-sm text-brand-text hover:text-brand-dark transition-colors"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {ranked.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-primary-400"
                      >
                        No worksheet activity data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Signups Table */}
          <div className="rounded-2xl border border-primary-100 bg-white shadow-sm">
            <div className="border-b border-primary-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-primary-900">
                Recent Signups
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-primary-50 bg-primary-50/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-primary-500">User</th>
                    <th className="px-6 py-3 font-medium text-primary-500">Role</th>
                    <th className="px-6 py-3 font-medium text-primary-500">Plan</th>
                    <th className="px-6 py-3 font-medium text-primary-500">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50">
                  {(recentUsers || []).map(
                    (u: {
                      id: string
                      email: string
                      full_name: string | null
                      role: string
                      subscription_tier: string
                      created_at: string
                    }) => (
                      <tr key={u.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium text-primary-900">
                              {u.full_name || 'No name'}
                            </p>
                            <p className="text-xs text-primary-400">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              roleColors[u.role] || 'bg-primary-100 text-primary-600'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              tierColors[u.subscription_tier] || tierColors.free
                            }`}
                          >
                            {u.subscription_tier}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-primary-500">
                          {new Date(u.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ),
                  )}
                  {(!recentUsers || recentUsers.length === 0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-primary-400"
                      >
                        No users yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column — Activity Feed */}
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-400">
            Platform Activity
          </h3>
          {activityData && activityData.length > 0 ? (
            <div className="space-y-3">
              {(activityData as (ActivityItem & { user_id: string })[]).map(
                (item, i) => {
                  const u = userMap[item.user_id]
                  return (
                    <div key={i} className="flex items-start gap-3">
                      {activityIcon(item.action)}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-primary-700">
                          {activityLabel(item)}
                        </p>
                        <p className="truncate text-xs text-primary-400">
                          {u?.full_name || u?.email || 'Unknown user'}{' '}
                          · {timeAgo(item.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                <svg
                  className="h-5 w-5 text-primary-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="mt-2 text-sm text-primary-400">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
