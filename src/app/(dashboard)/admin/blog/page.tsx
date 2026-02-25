import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { BlogPost } from '@/types/database'

export const metadata = { title: 'Blog Management — Formulate Admin' }

export default async function AdminBlogPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, title, slug, category, status, submitted_at, published_at, author_id, reading_time_minutes')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  // Fetch author names
  const authorIds = [...new Set((posts ?? []).map((p: { author_id: string }) => p.author_id))]
  const { data: authors } = authorIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, full_name, contributor_profile')
        .in('id', authorIds)
    : { data: [] }

  const authorMap = new Map<string, string>()
  for (const a of (authors ?? []) as { id: string; full_name: string | null; contributor_profile: { display_name: string } | null }[]) {
    authorMap.set(a.id, a.contributor_profile?.display_name || a.full_name || 'Unknown')
  }

  const blogPosts = (posts ?? []) as BlogPost[]

  const statusGroups = {
    submitted: blogPosts.filter((p) => p.status === 'submitted'),
    in_review: blogPosts.filter((p) => p.status === 'in_review'),
    changes_requested: blogPosts.filter((p) => p.status === 'changes_requested'),
    approved: blogPosts.filter((p) => p.status === 'approved'),
    published: blogPosts.filter((p) => p.status === 'published'),
    draft: blogPosts.filter((p) => p.status === 'draft'),
    rejected: blogPosts.filter((p) => p.status === 'rejected'),
  }

  const pendingCount = statusGroups.submitted.length + statusGroups.in_review.length

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <AdminTabs />

      <div className="mt-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Blog Posts</h1>
          <p className="text-sm text-primary-400">
            {blogPosts.length} total · {pendingCount} pending review
          </p>
        </div>
      </div>

      {blogPosts.length === 0 ? (
        <div className="rounded-2xl border border-primary-100 bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-primary-500">No blog posts yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary-100 bg-primary-50/50">
                <th className="px-4 py-3 font-medium text-primary-600">Title</th>
                <th className="px-4 py-3 font-medium text-primary-600 hidden sm:table-cell">Author</th>
                <th className="px-4 py-3 font-medium text-primary-600 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 font-medium text-primary-600">Status</th>
                <th className="px-4 py-3 font-medium text-primary-600 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {blogPosts.map((p) => (
                <tr key={p.id} className="border-b border-primary-50 hover:bg-primary-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="font-medium text-primary-900 hover:text-brand transition-colors"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-primary-500 hidden sm:table-cell">
                    {authorMap.get(p.author_id) || '—'}
                  </td>
                  <td className="px-4 py-3 text-primary-500 hidden md:table-cell">
                    {BLOG_CATEGORY_LABELS[p.category] || p.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        p.status === 'draft' ? 'bg-primary-100 text-primary-600' :
                        p.status === 'submitted' ? 'bg-blue-50 text-blue-700' :
                        p.status === 'in_review' ? 'bg-purple-50 text-purple-700' :
                        p.status === 'changes_requested' ? 'bg-amber-50 text-amber-700' :
                        p.status === 'approved' ? 'bg-green-50 text-green-700' :
                        p.status === 'published' ? 'bg-green-100 text-green-800' :
                        'bg-red-50 text-red-600'
                      }`}
                    >
                      {p.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-400 hidden lg:table-cell">
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : p.submitted_at
                        ? new Date(p.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
