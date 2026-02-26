import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { BlogPost } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Formulate',
  description: 'Clinical articles, worksheet guides, and practice tips for CBT therapists.',
  openGraph: {
    title: 'Blog — Formulate',
    description: 'Clinical articles, worksheet guides, and practice tips for CBT therapists.',
    type: 'website',
  },
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, cover_image_url, published_at, reading_time_minutes, helpful_count, author_id, tags')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: posts } = await query
  let blogPosts = (posts ?? []) as BlogPost[]

  // Client-side text search filter
  if (q) {
    const searchLower = q.toLowerCase()
    blogPosts = blogPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(searchLower)) ||
        p.tags.some((t) => t.toLowerCase().includes(searchLower))
    )
  }

  // Fetch author names (use admin client to bypass profiles RLS for anonymous visitors)
  const authorIds = [...new Set(blogPosts.map((p) => p.author_id))]
  const admin = createAdminClient()
  const { data: authors } = authorIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, full_name, contributor_profile')
        .in('id', authorIds)
    : { data: [] }

  const authorMap = new Map<string, string>()
  for (const a of (authors ?? []) as { id: string; full_name: string | null; contributor_profile: { display_name: string } | null }[]) {
    authorMap.set(a.id, a.contributor_profile?.display_name || a.full_name || 'Formulate')
  }

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'clinical', label: 'Clinical' },
    { value: 'worksheet-guide', label: 'Worksheet Guides' },
    { value: 'practice', label: 'Practice Tips' },
    { value: 'updates', label: 'Updates' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900">Blog</h1>
        <p className="mt-2 text-sm text-primary-500">
          Clinical articles, worksheet guides, and practice tips for CBT therapists.
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const isActive = (category || 'all') === cat.value
          return (
            <Link
              key={cat.value}
              href={cat.value === 'all' ? '/blog' : `/blog?category=${cat.value}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-brand text-white'
                  : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
            >
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Posts grid */}
      {blogPosts.length === 0 ? (
        <div className="rounded-2xl border border-primary-100 bg-surface p-12 text-center shadow-sm">
          <p className="text-sm text-primary-500">
            {q ? `No posts matching "${q}"` : category ? 'No posts in this category yet.' : 'No blog posts published yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden hover:border-primary-200 hover:shadow-md transition-all"
            >
              {/* Cover image */}
              {p.cover_image_url ? (
                <div className="h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-brand-light to-primary-100 flex items-center justify-center">
                  <span className="text-4xl opacity-30">📝</span>
                </div>
              )}

              <div className="p-4">
                {/* Category badge */}
                <span className="inline-block rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-medium text-brand-text uppercase tracking-wider">
                  {BLOG_CATEGORY_LABELS[p.category] || p.category}
                </span>

                <h2 className="mt-2 text-sm font-semibold text-primary-900 line-clamp-2 group-hover:text-brand transition-colors">
                  {p.title}
                </h2>

                {p.excerpt && (
                  <p className="mt-1 text-xs text-primary-500 line-clamp-2">{p.excerpt}</p>
                )}

                <div className="mt-3 flex items-center justify-between text-[10px] text-primary-400">
                  <span>{authorMap.get(p.author_id) || 'Formulate'}</span>
                  <div className="flex items-center gap-2">
                    {p.reading_time_minutes && <span>{p.reading_time_minutes} min</span>}
                    {p.published_at && (
                      <span>
                        {new Date(p.published_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
