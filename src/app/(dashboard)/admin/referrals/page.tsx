import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminTabs } from '@/components/admin/admin-tabs'

export const metadata = { title: 'Referral Analytics — Admin — Formulate' }

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default async function AdminReferralsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [
    { count: totalCodes },
    { count: totalReferrals },
    { count: convertedReferrals },
    { data: referralDetails },
  ] = await Promise.all([
    supabase.from('referral_codes').select('*', { count: 'exact', head: true }),
    supabase.from('referrals').select('*', { count: 'exact', head: true }),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
    // Get referral codes with referrer profiles + referral counts
    supabase
      .from('referral_codes')
      .select('id, code, user_id, created_at')
      .order('created_at', { ascending: false }),
  ])

  const conversionRate = (totalReferrals ?? 0) > 0
    ? Math.round(((convertedReferrals ?? 0) / (totalReferrals ?? 1)) * 100)
    : 0

  // Build referrer stats: for each code, count total and converted referrals
  const codeIds = (referralDetails || []).map((c: { id: string }) => c.id)
  const { data: allReferrals } = codeIds.length > 0
    ? await supabase
        .from('referrals')
        .select('referral_code_id, status')
        .in('referral_code_id', codeIds)
    : { data: [] }

  // Count referrals per code
  const codeStats: Record<string, { total: number; converted: number }> = {}
  for (const ref of (allReferrals || []) as { referral_code_id: string; status: string }[]) {
    if (!codeStats[ref.referral_code_id]) codeStats[ref.referral_code_id] = { total: 0, converted: 0 }
    codeStats[ref.referral_code_id].total++
    if (ref.status === 'converted') codeStats[ref.referral_code_id].converted++
  }

  // Fetch referrer profiles
  const userIds = [...new Set((referralDetails || []).map((c: { user_id: string }) => c.user_id))]
  const { data: referrerProfiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
    : { data: [] }

  const profileMap: Record<string, { email: string; full_name: string | null }> = Object.fromEntries(
    (referrerProfiles || []).map((p: { id: string; email: string; full_name: string | null }) => [
      p.id,
      { email: p.email, full_name: p.full_name },
    ]),
  )

  // Find top referrer
  let topReferrer = '—'
  let topReferrerCount = 0
  for (const code of (referralDetails || []) as { id: string; user_id: string }[]) {
    const stats = codeStats[code.id]
    if (stats && stats.total > topReferrerCount) {
      topReferrerCount = stats.total
      const p = profileMap[code.user_id]
      topReferrer = p?.full_name || p?.email || 'Unknown'
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Referrals</h1>
        <p className="mt-1 text-primary-400">Referral programme performance and leaderboard</p>
      </div>

      <AdminTabs />

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalCodes ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Referral Codes</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalReferrals ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Total Referrals</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{conversionRate}%</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Conversion
            <span className="text-primary-300"> · {convertedReferrals ?? 0} converted</span>
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-primary-900 truncate">{topReferrer}</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Top Referrer
            {topReferrerCount > 0 && <span className="text-primary-300"> · {topReferrerCount} referrals</span>}
          </p>
        </div>
      </div>

      {/* ── Referral Leaderboard ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm">
        <div className="border-b border-primary-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-primary-900">Referral Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-50 bg-primary-50/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">#</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">Referrer</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500">Code</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Referred</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Converted</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Rate</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {((referralDetails || []) as { id: string; code: string; user_id: string; created_at: string }[])
                .sort((a, b) => (codeStats[b.id]?.total ?? 0) - (codeStats[a.id]?.total ?? 0))
                .map((code, i) => {
                  const stats = codeStats[code.id] || { total: 0, converted: 0 }
                  const p = profileMap[code.user_id]
                  const rate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0
                  return (
                    <tr key={code.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 text-primary-400">{i + 1}</td>
                      <td className="px-3 sm:px-6 py-3">
                        <div>
                          <p className="font-medium text-primary-900">{p?.full_name || 'No name'}</p>
                          <p className="text-xs text-primary-400">{p?.email || '—'}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3">
                        <code className="rounded bg-primary-50 px-2 py-0.5 text-xs font-mono text-primary-700">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-right font-medium text-primary-900">{stats.total}</td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right text-primary-600">{stats.converted}</td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right">
                        {stats.total > 0 ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            rate >= 50 ? 'bg-green-50 text-green-700' :
                            rate > 0 ? 'bg-amber-50 text-amber-700' :
                            'bg-primary-100 text-primary-600'
                          }`}>
                            {rate}%
                          </span>
                        ) : (
                          <span className="text-primary-400">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-primary-500">
                        {new Date(code.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              {(!referralDetails || referralDetails.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-primary-400">
                    No referral codes created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
