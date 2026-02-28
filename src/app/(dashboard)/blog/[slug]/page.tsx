import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { BlogPost } from '@/types/database'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, tags, category, published_at, updated_at, cover_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (!post) return { title: 'Blog — Formulate' }

  const p = post as BlogPost
  const description = p.excerpt || `${p.title} — a ${BLOG_CATEGORY_LABELS[p.category] || p.category} article on Formulate`

  return {
    title: p.title,
    description,
    keywords: p.tags,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: p.title,
      description,
      type: 'article',
      publishedTime: p.published_at || undefined,
      modifiedTime: p.updated_at || undefined,
      images: p.cover_image_url ? [{ url: p.cover_image_url, alt: p.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title,
      description,
      images: p.cover_image_url ? [p.cover_image_url] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (!post) notFound()

  const p = post as BlogPost

  // Fetch author info (use admin client to bypass profiles RLS for anonymous visitors)
  const admin = createAdminClient()
  const { data: author } = await admin
    .from('profiles')
    .select('full_name, contributor_profile')
    .eq('id', p.author_id)
    .single()

  const authorProfile = author as { full_name: string | null; contributor_profile: { display_name: string; professional_title: string; bio: string } | null } | null
  const authorName = authorProfile?.contributor_profile?.display_name || authorProfile?.full_name || 'Formulate'
  const authorTitle = authorProfile?.contributor_profile?.professional_title || ''
  const authorBio = authorProfile?.contributor_profile?.bio || ''

  // Fetch related worksheets
  let relatedWorksheets: Array<{ id: string; title: string; slug: string; description: string }> = []
  if (p.related_worksheet_ids.length > 0) {
    const { data: worksheets } = await supabase
      .from('worksheets')
      .select('id, title, slug, description')
      .in('id', p.related_worksheet_ids)
      .eq('is_published', true)
      .is('deleted_at', null)

    relatedWorksheets = (worksheets ?? []) as typeof relatedWorksheets
  }

  // JSON-LD structured data
  const baseUrl = 'https://formulatetools.co.uk'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt,
    image: p.cover_image_url,
    datePublished: p.published_at,
    dateModified: p.updated_at,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorTitle ? { jobTitle: authorTitle } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Formulate',
      url: baseUrl,
    },
    mainEntityOfPage: `${baseUrl}/blog/${p.slug}`,
    ...(p.reading_time_minutes ? { timeRequired: `PT${p.reading_time_minutes}M` } : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: BLOG_CATEGORY_LABELS[p.category] || p.category, item: `${baseUrl}/blog?category=${p.category}` },
      { '@type': 'ListItem', position: 4, name: p.title },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Blog
          </Link>
        </div>

        {/* Category + reading time */}
        <div className="mb-3 flex items-center gap-3 text-xs">
          <Link
            href={`/blog?category=${p.category}`}
            className="rounded-full bg-brand-light px-2.5 py-0.5 font-medium text-brand-text uppercase tracking-wider hover:bg-brand/10 transition-colors"
          >
            {BLOG_CATEGORY_LABELS[p.category] || p.category}
          </Link>
          {p.reading_time_minutes && (
            <span className="text-primary-400">{p.reading_time_minutes} min read</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-primary-900 leading-tight">{p.title}</h1>

        {/* Author + date */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-primary-800">{authorName}</p>
            <p className="text-xs text-primary-400">
              {authorTitle ? `${authorTitle} · ` : ''}
              {p.published_at && new Date(p.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Cover image */}
        {p.cover_image_url && (
          <div className="relative mt-6 aspect-[2/1] overflow-hidden rounded-xl">
            <Image
              src={p.cover_image_url}
              alt={`Cover image for ${p.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="mt-8">
          <BlogPostContent content={p.content} />
        </div>

        {/* Tags */}
        {p.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {p.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs text-primary-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Related worksheets */}
        {relatedWorksheets.length > 0 && (
          <div className="mt-10 rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-primary-900">Related Worksheets</h2>
            <div className="space-y-3">
              {relatedWorksheets.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/worksheets/${ws.slug}`}
                  className="block rounded-xl border border-primary-100 px-4 py-3 hover:border-brand/30 hover:bg-brand-light/30 transition-colors"
                >
                  <p className="text-sm font-medium text-primary-900">{ws.title}</p>
                  <p className="mt-0.5 text-xs text-primary-500 line-clamp-1">{ws.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author card */}
        {authorBio && (
          <div className="mt-8 rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white text-lg font-bold">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">{authorName}</p>
                {authorTitle && <p className="text-xs text-primary-500">{authorTitle}</p>}
                <p className="mt-1 text-xs text-primary-600 leading-relaxed">{authorBio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 flex items-center gap-3">
          <span className="text-xs text-primary-400">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(`https://formulatetools.co.uk/blog/${p.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-500 hover:text-brand transition-colors"
          >
            Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://formulatetools.co.uk/blog/${p.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-500 hover:text-brand transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </article>
    </>
  )
}
