import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { PopularWorksheetsChart } from '@/components/admin/popular-worksheets-chart'

export const metadata = { title: 'Content Analytics — Admin — Formulate' }

/* ─── Helpers ─────────────────────────────────────────────────────────── */

interface AccessLog {
  worksheet_id: string
  access_type: string
  created_at: string
}

interface AssignmentLog {
  worksheet_id: string
}

interface WorksheetInfo {
  id: string
  title: string
  slug: string
  is_published: boolean
  category_id: string
}

interface CategoryInfo {
  id: string
  name: string
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

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default async function AdminContentPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalViews },
    { count: totalExports },
    { count: totalAssignments },
    { count: viewsLast30d },
    { count: viewsPrev30d },
    { count: exportsLast30d },
    { count: exportsPrev30d },
    { data: accessLogs },
    { data: assignmentLogs },
    { data: worksheetDetails },
    { data: categories },
    { data: searchLogs },
  ] = await Promise.all([
    // Totals
    supabase.from('worksheet_access_log').select('*', { count: 'exact', head: true }).in('access_type', ['view', 'interact']),
    supabase.from('worksheet_access_log').select('*', { count: 'exact', head: true }).eq('access_type', 'export'),
    supabase.from('worksheet_assignments').select('*', { count: 'exact', head: true }).is('deleted_at', null),

    // Views last 30d
    supabase.from('worksheet_access_log').select('*', { count: 'exact', head: true }).in('access_type', ['view', 'interact']).gte('created_at', thirtyDaysAgo),
    // Views prev 30d
    supabase.from('worksheet_access_log').select('*', { count: 'exact', head: true }).in('access_type', ['view', 'interact']).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
    // Exports last 30d
    supabase.from('worksheet_access_log').select('*', { count: 'exact', head: true }).eq('access_type', 'export').gte('created_at', thirtyDaysAgo),
    // Exports prev 30d
    supabase.from('worksheet_access_log').select('*', { count: 'exact', head: true }).eq('access_type', 'export').gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),

    // All access logs for ranking
    supabase.from('worksheet_access_log').select('worksheet_id, access_type, created_at'),
    supabase.from('worksheet_assignments').select('worksheet_id').is('deleted_at', null),
    supabase.from('worksheets').select('id, title, slug, is_published, category_id').is('deleted_at', null),
    supabase.from('categories').select('id, name'),

    // Search logs from audit
    supabase.from('audit_log').select('metadata').eq('entity_type', 'search').order('created_at', { ascending: false }).limit(500),
  ])

  const ranked = rankWorksheets(
    (accessLogs || []) as AccessLog[],
    (assignmentLogs || []) as AssignmentLog[],
    (worksheetDetails || []) as WorksheetInfo[],
  )

  // Period-over-period changes
  const viewsChange = (viewsPrev30d ?? 0) > 0
    ? Math.round(((viewsLast30d ?? 0) - (viewsPrev30d ?? 0)) / (viewsPrev30d ?? 1) * 100)
    : 0
  const exportsChange = (exportsPrev30d ?? 0) > 0
    ? Math.round(((exportsLast30d ?? 0) - (exportsPrev30d ?? 0)) / (exportsPrev30d ?? 1) * 100)
    : 0

  // Category usage
  const categoryMap = new Map((categories || []).map((c: CategoryInfo) => [c.id, c.name]))
  const categoryStats: Record<string, number> = {}
  for (const ws of ranked) {
    const catName = categoryMap.get(ws.category_id) || 'Uncategorised'
    categoryStats[catName] = (categoryStats[catName] || 0) + ws.total
  }
  const sortedCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)

  // Search terms analysis
  const searchTerms: Record<string, number> = {}
  for (const log of (searchLogs || []) as { metadata: { query?: string } | null }[]) {
    const query = log.metadata?.query?.toLowerCase().trim()
    if (query) {
      searchTerms[query] = (searchTerms[query] || 0) + 1
    }
  }
  const topSearchTerms = Object.entries(searchTerms)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Content</h1>
        <p className="mt-1 text-primary-400">Worksheet usage, popularity, and search insights</p>
      </div>

      <AdminTabs />

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalViews ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Total Views</p>
          {viewsChange !== 0 && (
            <p className={`mt-1 text-xs font-medium ${viewsChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {viewsChange >= 0 ? '↑' : '↓'} {Math.abs(viewsChange)}% vs prev 30d
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalExports ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">PDF Exports</p>
          {exportsChange !== 0 && (
            <p className={`mt-1 text-xs font-medium ${exportsChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {exportsChange >= 0 ? '↑' : '↓'} {Math.abs(exportsChange)}% vs prev 30d
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalAssignments ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">Assignments</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{(worksheetDetails || []).length}</p>
          <p className="mt-0.5 text-sm text-primary-400">Total Worksheets</p>
        </div>
      </div>

      {/* ── Popular Worksheets Chart ─────────────────────────────────── */}
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

      {/* ── Bottom section: Category Usage + Search Terms ─────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Usage */}
        <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm">
          <div className="border-b border-primary-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-primary-900">Usage by Category</h3>
          </div>
          <div className="p-6">
            {sortedCategories.length > 0 ? (
              <div className="space-y-3">
                {sortedCategories.map(([name, count]) => {
                  const maxCount = sortedCategories[0]?.[1] || 1
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-primary-700">{name}</span>
                        <span className="text-primary-400">{count} interactions</span>
                      </div>
                      <div className="h-2 rounded-full bg-primary-100">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-primary-400">No category data yet</p>
            )}
          </div>
        </div>

        {/* Search Terms */}
        <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm">
          <div className="border-b border-primary-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-primary-900">Top Search Terms</h3>
            <p className="mt-0.5 text-xs text-primary-400">What users are looking for</p>
          </div>
          <div className="overflow-x-auto">
            {topSearchTerms.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-primary-50 bg-primary-50/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">#</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">Search Term</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Searches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50">
                  {topSearchTerms.map(([term, count], i) => (
                    <tr key={term} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-3 sm:px-6 py-2.5 text-primary-400">{i + 1}</td>
                      <td className="px-3 sm:px-6 py-2.5 font-medium text-primary-900">{term}</td>
                      <td className="px-3 sm:px-6 py-2.5 text-right text-primary-600">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-6 py-10 text-center text-sm text-primary-400">
                No search data yet. Search tracking will start collecting data after deployment.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Full Worksheets Table ──────────────────────────────────── */}
      <div className="mt-8 rounded-2xl border border-primary-100 bg-surface shadow-sm">
        <div className="border-b border-primary-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-primary-900">All Worksheets by Popularity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-50 bg-primary-50/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">#</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500">Title</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500">Category</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Views</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Assigns</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Exports</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500 text-right">Total</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-primary-500">Status</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-primary-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {ranked.slice(0, 30).map((ws, i) => (
                <tr key={ws.id} className="hover:bg-primary-50/50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 text-primary-400">{i + 1}</td>
                  <td className="px-3 sm:px-6 py-3 font-medium text-primary-900">{ws.title}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-primary-500">{categoryMap.get(ws.category_id) || '—'}</td>
                  <td className="px-3 sm:px-6 py-3 text-right text-primary-600">{ws.views}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right text-primary-600">{ws.assignments}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right text-primary-600">{ws.exports}</td>
                  <td className="px-3 sm:px-6 py-3 text-right font-medium text-primary-900">{ws.total}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      ws.is_published ? 'bg-brand/10 text-brand-dark' : 'bg-primary-100 text-primary-600'
                    }`}>
                      {ws.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3">
                    <Link href={`/admin/worksheets/${ws.slug}/edit`} className="text-sm text-brand-text hover:text-brand-dark transition-colors">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {ranked.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-primary-400">No worksheet activity data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
