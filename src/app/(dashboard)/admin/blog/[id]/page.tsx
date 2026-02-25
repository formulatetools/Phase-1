import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import { BlogSubmissionActions } from './blog-submission-actions'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { BlogPost } from '@/types/database'

export const metadata = { title: 'Review Blog Post — Formulate Admin' }

export default async function AdminBlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: post } = await admin
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!post) notFound()

  const p = post as BlogPost

  // Fetch author info
  const { data: author } = await admin
    .from('profiles')
    .select('full_name, contributor_profile')
    .eq('id', p.author_id)
    .single()

  const authorProfile = author as { full_name: string | null; contributor_profile: { display_name: string; professional_title: string } | null } | null
  const authorName = authorProfile?.contributor_profile?.display_name || authorProfile?.full_name || 'Unknown'
  const authorTitle = authorProfile?.contributor_profile?.professional_title || ''

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <AdminTabs />

      <div className="mt-6 mb-2">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Blog Posts
        </Link>
      </div>

      {/* Post header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-primary-900">{p.title}</h1>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
        <p className="text-sm text-primary-400">
          By {authorName}{authorTitle ? ` · ${authorTitle}` : ''} · {BLOG_CATEGORY_LABELS[p.category] || p.category}
          {p.reading_time_minutes ? ` · ${p.reading_time_minutes} min read` : ''}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content preview */}
        <div className="lg:col-span-2">
          {p.cover_image_url && (
            <div className="mb-4 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.cover_image_url} alt="" className="w-full max-h-64 object-cover" />
            </div>
          )}

          {p.excerpt && (
            <p className="mb-4 text-sm italic text-primary-500">{p.excerpt}</p>
          )}

          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <BlogPostContent content={p.content} />
          </div>
        </div>

        {/* Sidebar: metadata + actions */}
        <div className="space-y-6">
          {/* Post metadata */}
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-primary-900">Post Details</h2>

            {p.excerpt && (
              <div className="rounded-xl bg-primary-50 px-4 py-3">
                <p className="text-xs font-medium text-primary-500">Excerpt</p>
                <p className="mt-0.5 text-sm text-primary-700">{p.excerpt}</p>
              </div>
            )}

            {p.tags.length > 0 && (
              <div className="rounded-xl bg-primary-50 px-4 py-3">
                <p className="text-xs font-medium text-primary-500">Tags</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary-200/50 px-2 py-0.5 text-[10px] text-primary-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {p.related_worksheet_ids.length > 0 && (
              <div className="rounded-xl bg-primary-50 px-4 py-3">
                <p className="text-xs font-medium text-primary-500">Related Worksheets</p>
                <p className="mt-0.5 text-sm text-primary-700">{p.related_worksheet_ids.length} linked</p>
              </div>
            )}
          </div>

          {/* Admin actions */}
          <BlogSubmissionActions
            postId={p.id}
            currentStatus={p.status}
            existingFeedback={p.admin_feedback}
          />
        </div>
      </div>
    </div>
  )
}
