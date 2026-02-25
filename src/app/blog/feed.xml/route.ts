import { createClient } from '@supabase/supabase-js'

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
    .select('title, slug, excerpt, category, published_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(20)

  const baseUrl = 'https://formulatetools.co.uk'

  const items = (posts ?? [])
    .map(
      (p: { title: string; slug: string; excerpt: string | null; category: string; published_at: string }) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${baseUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt || ''}]]></description>
      <category>${p.category}</category>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Formulate Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Clinical articles, worksheet guides, and practice tips for CBT therapists.</description>
    <language>en-gb</language>
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
