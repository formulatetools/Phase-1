/**
 * Server-side OpenGraph unfurling utility.
 * Fetches a URL's HTML and extracts og:title, og:description, og:image, og:site_name.
 * Used when therapists share external links with clients.
 */

export interface OGData {
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  og_site_name: string | null
}

const NULL_OG: OGData = {
  og_title: null,
  og_description: null,
  og_image_url: null,
  og_site_name: null,
}

/**
 * Fetch and parse OpenGraph meta tags from a URL.
 * - 5 second timeout
 * - Returns null fields on any error (non-blocking)
 * - Only reads first 50KB of HTML to avoid large downloads
 */
export async function unfurlUrl(url: string): Promise<OGData> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Formulate-Bot/1.0 (+https://formulatetools.co.uk)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!response.ok) return NULL_OG

    // Only read the first 50KB — OG tags are always in <head>
    const reader = response.body?.getReader()
    if (!reader) return NULL_OG

    let html = ''
    const decoder = new TextDecoder()
    const MAX_BYTES = 50_000

    while (html.length < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
    }
    reader.cancel()

    return {
      og_title: getMetaContent(html, 'og:title') || extractTitle(html),
      og_description: getMetaContent(html, 'og:description') || getMetaContent(html, 'description'),
      og_image_url: getMetaContent(html, 'og:image'),
      og_site_name: getMetaContent(html, 'og:site_name'),
    }
  } catch {
    return NULL_OG
  }
}

/** Extract content from a meta tag by property or name attribute */
function getMetaContent(html: string, property: string): string | null {
  // Match property="..." content="..."
  const propMatch = html.match(
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
      'i'
    )
  )
  if (propMatch) return decodeHtmlEntities(propMatch[1])

  // Match content="..." property="..." (reversed attribute order)
  const revMatch = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
      'i'
    )
  )
  if (revMatch) return decodeHtmlEntities(revMatch[1])

  return null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match?.[1]?.trim() || null
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}
