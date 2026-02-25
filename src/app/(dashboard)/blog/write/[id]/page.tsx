import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ContributorRoles, BlogPost, BlogCategory } from '@/types/database'
import { BlogPostForm } from '../new/blog-post-form'

export const metadata = { title: 'Edit Blog Post — Formulate' }

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_contributor && !roles?.clinical_reviewer && !roles?.content_writer) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .eq('author_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!post) notFound()

  const p = post as BlogPost

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <Link
          href="/blog/write"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          My Blog Posts
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-primary-900">Edit Blog Post</h1>
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

      <BlogPostForm
        postId={p.id}
        initialTitle={p.title}
        initialExcerpt={p.excerpt || ''}
        initialCategory={p.category as BlogCategory}
        initialTags={p.tags}
        initialContent={p.content}
        initialCoverImageUrl={p.cover_image_url}
        initialRelatedWorksheetIds={p.related_worksheet_ids}
        initialStatus={p.status}
        initialFeedback={p.admin_feedback}
      />
    </div>
  )
}
