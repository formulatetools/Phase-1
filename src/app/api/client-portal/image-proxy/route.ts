import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Proxies external OG images so that client IP addresses are not leaked
 * to third-party servers when viewing shared resources in the portal.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
  }

  // Block private/internal IP ranges to prevent SSRF
  const hostname = parsed.hostname
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname === '[::1]' ||
    hostname.startsWith('169.254.') ||
    hostname.startsWith('0.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  ) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'image/*' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim()
    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 })
    }

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
