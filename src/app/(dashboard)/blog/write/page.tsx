import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { ContributorRoles, BlogPost } from '@/types/database'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'

export const metadata = { title: 'My Blog Posts — Formulate' }

export default async function MyBlogPostsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_contributor && !roles?.clinical_reviewer && !roles?.content_writer) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, category, status, submitted_at, published_at, admin_feedback, reading_time_minutes, updated_at')
    .eq('author_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const blogPosts = (posts ?? []) as BlogPost[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-900">My Blog Posts</h1>
        <Link
          href="/blog/write/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors"
        >
          + New Post
        </Link>
      </div>

      {blogPosts.length === 0 ? (
        <div className="rounded-2xl border border-primary-100 bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-primary-500">You haven&apos;t written any blog posts yet.</p>
          <Link
            href="/blog/write/new"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors"
          >
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {blogPosts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/write/${p.id}`}
              className="block rounded-2xl border border-primary-100 bg-surface px-5 py-4 shadow-sm hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-primary-900 truncate">{p.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-primary-400">
                    <span>{BLOG_CATEGORY_LABELS[p.category] || p.category}</span>
                    {p.reading_time_minutes && (
                      <>
                        <span>·</span>
                        <span>{p.reading_time_minutes} min read</span>
                      </>
                    )}
                  </div>
                  {p.admin_feedback && p.status === 'changes_requested' && (
                    <p className="mt-1.5 text-xs text-amber-600 line-clamp-1">
                      Feedback: {p.admin_feedback}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
