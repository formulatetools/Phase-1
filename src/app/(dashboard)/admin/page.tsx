import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Admin — Formulate' }

export default async function AdminPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Subscriber metrics
  const { data: profiles } = await supabase
    .from('profiles')
    .select('subscription_tier')

  const tierCounts = { free: 0, standard: 0, professional: 0 }
  for (const p of profiles || []) {
    const tier = p.subscription_tier as keyof typeof tierCounts
    if (tier in tierCounts) tierCounts[tier]++
  }
  const totalUsers = (profiles || []).length

  // Worksheet stats
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('id, title, slug, is_published, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Most accessed worksheets
  const { data: accessStats } = await supabase
    .from('worksheet_access_log')
    .select('worksheet_id')

  const accessCounts: Record<string, number> = {}
  for (const log of accessStats || []) {
    const wid = log.worksheet_id as string
    accessCounts[wid] = (accessCounts[wid] || 0) + 1
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-900">Admin Panel</h1>
        <Link
          href="/admin/worksheets/new"
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          New Worksheet
        </Link>
      </div>

      {/* Subscriber metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-500">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-primary-900">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-500">Free</p>
          <p className="mt-1 text-2xl font-bold text-primary-900">{tierCounts.free}</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-500">Standard</p>
          <p className="mt-1 text-2xl font-bold text-accent-600">{tierCounts.standard}</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-500">Professional</p>
          <p className="mt-1 text-2xl font-bold text-accent-700">{tierCounts.professional}</p>
        </div>
      </div>

      {/* Worksheets list */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-primary-900">Worksheets</h2>
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-100 bg-primary-50">
              <tr>
                <th className="px-4 py-3 font-medium text-primary-600">Title</th>
                <th className="px-4 py-3 font-medium text-primary-600">Status</th>
                <th className="px-4 py-3 font-medium text-primary-600">Accesses</th>
                <th className="px-4 py-3 font-medium text-primary-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {(worksheets || []).map((ws: { id: string; title: string; slug: string; is_published: boolean }) => (
                <tr key={ws.id}>
                  <td className="px-4 py-3 font-medium text-primary-900">{ws.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      ws.is_published
                        ? 'bg-accent-100 text-accent-700'
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      {ws.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary-500">
                    {accessCounts[ws.id] || 0}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/worksheets/${ws.slug}/edit`}
                      className="text-sm text-accent-600 hover:text-accent-700"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {(!worksheets || worksheets.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-primary-500">
                    No worksheets yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
