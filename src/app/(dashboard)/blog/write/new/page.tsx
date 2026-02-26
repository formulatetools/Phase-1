import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import type { ContributorRoles } from '@/types/database'
import { BlogPostForm } from './blog-post-form'

export const metadata = { title: 'New Blog Post — Formulate' }

export default async function NewBlogPostPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_contributor && !roles?.clinical_reviewer && !roles?.content_writer) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <div className="mb-2">
        <Link
          href="/blog/write"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          My Blog Posts
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-primary-900">New Blog Post</h1>

      <BlogPostForm />
    </div>
  )
}
