import { createClient } from '@supabase/supabase-js'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'

/**
 * RSS 2.0 feed for published blog posts.
 * GET /blog/feed.xml
 */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, category, published_at, cover_image_url')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const baseUrl = 'https://formulatetools.co.uk'
  const allPosts = (posts ?? []) as Array<{ title: string; slug: string; excerpt: string | null; category: string; published_at: string; cover_image_url: string | null }>

  /** Escape XML special characters in text content */
  function escXml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const items = allPosts
    .map(
      (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${baseUrl}/blog/${escXml(p.slug)}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${escXml(p.slug)}</guid>
      <description><![CDATA[${p.excerpt || ''}]]></description>
      <category>${escXml(BLOG_CATEGORY_LABELS[p.category] || p.category)}</category>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>${
        p.cover_image_url
          ? `\n      <enclosure url="${escXml(p.cover_image_url)}" type="image/jpeg" length="0"/>`
          : ''
      }
    </item>`
    )
    .join('')

  const lastBuildDate = allPosts.length > 0
    ? new Date(allPosts[0].published_at).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Formulate Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Clinical articles, worksheet guides, and practice tips for CBT therapists.</description>
    <language>en-gb</language>
    <generator>Formulate</generator>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
