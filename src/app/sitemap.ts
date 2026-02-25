import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://formulatetools.co.uk'

  // Direct Supabase client (no auth/cookies needed for public data)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch published worksheets, categories, and blog posts in parallel
  const [{ data: worksheets }, { data: categories }, { data: blogPosts }] = await Promise.all([
    supabase
      .from('worksheets')
      .select('slug, updated_at')
      .eq('is_published', true)
      .is('deleted_at', null),
    supabase.from('categories').select('slug'),
    supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .is('deleted_at', null),
  ])

  // ── Static pages ─────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/worksheets`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // ── Individual worksheet pages ───────────────────────────────────────────
  const worksheetPages: MetadataRoute.Sitemap = (worksheets || []).map((w) => ({
    url: `${baseUrl}/worksheets/${w.slug}`,
    lastModified: new Date(w.updated_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // ── Category pages ───────────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((c) => ({
    url: `${baseUrl}/worksheets/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // ── Blog pages ──────────────────────────────────────────────────────────
  const blogIndex: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]

  const blogPostPages: MetadataRoute.Sitemap = (blogPosts || []).map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogCategoryPages: MetadataRoute.Sitemap = [
    'clinical', 'worksheet-guide', 'practice', 'updates',
  ].map((cat) => ({
    url: `${baseUrl}/blog/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...worksheetPages, ...categoryPages, ...blogIndex, ...blogPostPages, ...blogCategoryPages]
}
