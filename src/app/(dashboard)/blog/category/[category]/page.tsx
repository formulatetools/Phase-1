import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { BlogPost } from '@/types/database'
import type { Metadata } from 'next'

const validCategories = ['clinical', 'worksheet-guide', 'practice', 'updates']

export function generateStaticParams() {
  return validCategories.map((category) => ({ category }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const label = BLOG_CATEGORY_LABELS[category] || category

  if (!validCategories.includes(category)) {
    return { title: 'Blog — Formulate' }
  }

  return {
    title: `${label} Articles — Formulate Blog`,
    description: `Browse ${label.toLowerCase()} articles on the Formulate blog.`,
    alternates: {
      canonical: `/blog/category/${category}`,
    },
    openGraph: {
      title: `${label} Articles — Formulate Blog`,
      description: `Browse ${label.toLowerCase()} articles on the Formulate blog.`,
      type: 'website',
    },
  }
}

/**
 * Category pages render a filtered blog listing so that crawlers
 * can index them directly (no redirect) and users get a proper landing page.
 */
export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!validCategories.includes(category)) {
    notFound()
  }

  const label = BLOG_CATEGORY_LABELS[category] || category
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, cover_image_url, published_at, reading_time_minutes, helpful_count, author_id, tags')
    .eq('status', 'published')
    .eq('category', category)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  const blogPosts = (posts ?? []) as BlogPost[]

  // Fetch author names
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
        <h1 className="text-3xl font-bold text-primary-900">{label} Articles</h1>
        <p className="mt-2 text-sm text-primary-500">
          Browse {label.toLowerCase()} articles on the Formulate blog.
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const isActive = category === cat.value
          const href = cat.value === 'all' ? '/blog' : `/blog/category/${cat.value}`
          return (
            <Link
              key={cat.value}
              href={href}
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
          <p className="text-sm text-primary-500">No {label.toLowerCase()} articles published yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden hover:border-primary-200 hover:shadow-md transition-all"
            >
              {p.cover_image_url ? (
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={p.cover_image_url}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-brand-light to-primary-100 flex items-center justify-center">
                  <span className="text-4xl opacity-30">📝</span>
                </div>
              )}

              <div className="p-4">
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
