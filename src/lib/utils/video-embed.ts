/**
 * Detect whether a URL is a YouTube or Vimeo video and return embed info.
 * Used client-side for display only — nothing is stored.
 */

export interface VideoEmbed {
  type: 'youtube' | 'vimeo'
  embedUrl: string
  thumbnailUrl: string
}

/**
 * Check if a URL is a recognisable video platform and return embed details.
 * Returns null for non-video URLs.
 */
export function detectVideoEmbed(url: string): VideoEmbed | null {
  // YouTube — youtube.com/watch, /embed/, /shorts/, youtu.be
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`,
    }
  }

  // Vimeo — vimeo.com/123456
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnailUrl: '', // Vimeo thumbnails require an API call; skip for MVP
    }
  }

  return null
}

/** Extract the domain name from a URL for display (e.g., "youtube.com") */
export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
