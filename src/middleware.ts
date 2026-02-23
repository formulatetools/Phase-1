import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Routes accessible without authentication
const publicRoutes = ['/', '/login', '/signup', '/pricing', '/privacy', '/terms', '/auth/callback']

// Routes that are browse-only for unauthenticated users (worksheet library + homework links)
const browseRoutes = ['/worksheets', '/hw']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate limiting for API routes ─────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const config = RATE_LIMITS[pathname]
    if (config) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
      const key = `${ip}:${pathname}`
      const result = checkRateLimit(key, config.limit, config.windowMs)

      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.resetAt),
              'Retry-After': String(Math.max(1, result.resetAt - Math.floor(Date.now() / 1000))),
            },
          }
        )
      }

      // Allow request with rate limit headers
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', String(result.limit))
      response.headers.set('X-RateLimit-Remaining', String(result.remaining))
      response.headers.set('X-RateLimit-Reset', String(result.resetAt))
      return response
    }

    // Non-rate-limited API routes (webhooks, crons, health) pass through
    return NextResponse.next()
  }

  // ── Auth middleware for page routes ──────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  // Skip auth checks if Supabase isn't configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route)) {
    return supabaseResponse
  }

  // Allow browse-only routes (worksheet library is the acquisition funnel)
  if (browseRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // API routes that need rate limiting
    '/api/checkout',
    '/api/portal',
    '/api/homework',
    // All non-static, non-API page routes (existing auth pattern)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}
