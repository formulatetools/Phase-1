import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LABELS } from '@/lib/stripe/config'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { SignupChart } from '@/components/admin/signup-chart'
import { TierDistributionChart } from '@/components/admin/tier-distribution-chart'

export const metadata = { title: 'User Analytics — Admin — Formulate' }

/* ─── Helpers ─────────────────────────────────────────────────────────── */

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

/** Build retention cohort data: for each signup week, what % are still active in weeks 1-8 */
function buildRetentionCohorts(
  profiles: { id: string; created_at: string }[],
  auditLogs: { user_id: string; created_at: string }[],
): { cohort: string; users: number; weeks: number[] }[] {
  // Group users by signup week
  const cohortUsers: Record<string, Set<string>> = {}
  for (const p of profiles) {
    const d = new Date(p.created_at)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    if (!cohortUsers[key]) cohortUsers[key] = new Set()
    cohortUsers[key].add(p.id)
  }

  // Group audit log entries by user and week
  const userActivityWeeks: Record<string, Set<string>> = {}
  for (const log of auditLogs) {
    const d = new Date(log.created_at)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const weekKey = monday.toISOString().slice(0, 10)
    if (!userActivityWeeks[log.user_id]) userActivityWeeks[log.user_id] = new Set()
    userActivityWeeks[log.user_id].add(weekKey)
  }

  // Sort cohort weeks and take last 8
  const sortedCohorts = Object.keys(cohortUsers).sort().slice(-8)

  return sortedCohorts.map((cohortWeek) => {
    const users = cohortUsers[cohortWeek]
    const userCount = users.size
    const weeks: number[] = []

    // Check retention for weeks 1-8 after cohort week
    for (let w = 1; w <= 8; w++) {
      const targetWeek = new Date(cohortWeek)
      targetWeek.setDate(targetWeek.getDate() + w * 7)
      const targetKey = targetWeek.toISOString().slice(0, 10)

      // If target week is in the future, push -1
      if (targetWeek > new Date()) {
        weeks.push(-1)
        continue
      }

      let activeInWeek = 0
      for (const userId of users) {
        if (userActivityWeeks[userId]?.has(targetKey)) {
          activeInWeek++
        }
      }
      weeks.push(userCount > 0 ? Math.round((activeInWeek / userCount) * 100) : 0)
    }

    return {
      cohort: new Date(cohortWeek).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      users: userCount,
      weeks,
    }
  })
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default async function AdminUsersPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: newUsers30d },
    { data: activeUsers7d },
    { data: activeUsers30d },
    { data: signupDates },
    { data: tierCounts },
    { data: allProfiles },
    { data: recentAuditLogs },
    { data: allUsers },
    { count: paidUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist').gte('created_at', thirtyDaysAgo),
    supabase.from('audit_log').select('user_id').gte('created_at', sevenDaysAgo),
    supabase.from('audit_log').select('user_id').gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('created_at').eq('role', 'therapist').gte('created_at', twelveMonthsAgo.toISOString()).order('created_at', { ascending: true }),
    supabase.from('profiles').select('subscription_tier').eq('role', 'therapist'),
    // For retention: profiles from last 10 weeks
    supabase.from('profiles').select('id, created_at').eq('role', 'therapist').gte('created_at', new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()),
    // Audit logs from last 10 weeks (for retention)
    supabase.from('audit_log').select('user_id, created_at').gte('created_at', new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()),
    // All users for the table
    supabase.from('profiles').select('id, email, full_name, subscription_tier, subscription_status, created_at').eq('role', 'therapist').order('created_at', { ascending: false }).limit(50),
    // Paid users count
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist').neq('subscription_tier', 'free'),
  ])

  const active7d = new Set((activeUsers7d || []).map((r: { user_id: string }) => r.user_id)).size
  const active30d = new Set((activeUsers30d || []).map((r: { user_id: string }) => r.user_id)).size
  const conversionRate = (totalUsers ?? 0) > 0 ? Math.round(((paidUsers ?? 0) / (totalUsers ?? 1)) * 100) : 0

  const signupsByWeek = aggregateByWeek(
    (signupDates || []).map((r: { created_at: string }) => r.created_at),
  )

  // Tier distribution
  const tierMap: Record<string, number> = { Free: 0, Starter: 0, Practice: 0, Specialist: 0 }
  for (const p of (tierCounts || []) as { subscription_tier: string }[]) {
    const label = TIER_LABELS[p.subscription_tier] || 'Free'
    tierMap[label] = (tierMap[label] || 0) + 1
  }
  const tierDistribution = Object.entries(tierMap).map(([tier, count]) => ({ tier, count }))

  // Retention cohorts
  const retentionData = buildRetentionCohorts(
    (allProfiles || []) as { id: string; created_at: string }[],
    (recentAuditLogs || []) as { user_id: string; created_at: string }[],
  )

  // Tier badge colours
  const tierColors: Record<string, string> = {
    free: 'bg-primary-100 text-primary-600',
    starter: 'bg-amber-50 text-amber-700',
    standard: 'bg-brand/10 text-brand-dark',
    professional: 'bg-purple-50 text-purple-700',
  }

  // Last active: build from audit log
  const lastActiveMap: Record<string, string> = {}
  for (const log of (recentAuditLogs || []) as { user_id: string; created_at: string }[]) {
    if (!lastActiveMap[log.user_id] || log.created_at > lastActiveMap[log.user_id]) {
      lastActiveMap[log.user_id] = log.created_at
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Users</h1>
        <p className="mt-1 text-primary-400">User growth, retention, and engagement</p>
      </div>

      <AdminTabs />

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalUsers ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Total Users</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{newUsers30d ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">New (30d)</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{active7d}</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Active (7d)
            <span className="text-primary-300"> · {active30d} in 30d</span>
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{conversionRate}%</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Free → Paid
            <span className="text-primary-300"> · {paidUsers ?? 0} paid</span>
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">
            {tierMap.Free}:{tierMap.Starter + tierMap.Practice + tierMap.Specialist}
          </p>
          <p className="mt-0.5 text-sm text-primary-400">Free : Paid</p>
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <SignupChart data={signupsByWeek} />
        <TierDistributionChart data={tierDistribution} />
      </div>

      {/* ── Retention Cohorts ────────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-primary-100 bg-surface shadow-sm">
        <div className="border-b border-primary-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-primary-900">Weekly Retention Cohorts</h3>
          <p className="mt-0.5 text-xs text-primary-400">% of users still active in each week after signup</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-50 bg-primary-50/50">
              <tr>
                <th className="px-4 py-3 font-medium text-primary-500">Cohort</th>
                <th className="px-4 py-3 font-medium text-primary-500 text-center">Users</th>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                  <th key={w} className="px-4 py-3 font-medium text-primary-500 text-center">W{w}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {retentionData.map((row) => (
                <tr key={row.cohort} className="hover:bg-primary-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary-900">{row.cohort}</td>
                  <td className="px-4 py-3 text-center text-primary-600">{row.users}</td>
                  {row.weeks.map((pct, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {pct === -1 ? (
                        <span className="text-primary-300">—</span>
                      ) : (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            pct >= 50 ? 'bg-green-50 text-green-700' :
                            pct >= 25 ? 'bg-amber-50 text-amber-700' :
                            pct > 0 ? 'bg-red-50 text-red-600' :
                            'bg-primary-50 text-primary-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {retentionData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-primary-400">
                    Not enough data for retention cohorts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── All Users Table ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm">
        <div className="border-b border-primary-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-primary-900">All Users</h3>
          <p className="mt-0.5 text-xs text-primary-400">Most recent 50 users</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-50 bg-primary-50/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">User</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">Plan</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500">Status</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500">Last Active</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {(allUsers || []).map(
                (u: {
                  id: string
                  email: string
                  full_name: string | null
                  subscription_tier: string
                  subscription_status: string
                  created_at: string
                }) => {
                  const lastActive = lastActiveMap[u.id]
                  return (
                    <tr key={u.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-3 sm:px-6 py-3">
                        <div>
                          <p className="font-medium text-primary-900">{u.full_name || 'No name'}</p>
                          <p className="text-xs text-primary-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[u.subscription_tier] || tierColors.free}`}>
                          {TIER_LABELS[u.subscription_tier] || u.subscription_tier}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.subscription_status === 'active' ? 'bg-green-50 text-green-700' :
                          u.subscription_status === 'past_due' ? 'bg-amber-50 text-amber-700' :
                          u.subscription_status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-primary-100 text-primary-600'
                        }`}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-primary-500">
                        {lastActive
                          ? new Date(lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : 'Never'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-primary-500">
                        {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                },
              )}
              {(!allUsers || allUsers.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-primary-400">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
