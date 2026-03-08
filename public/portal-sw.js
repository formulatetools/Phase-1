// Service worker for client portal & homework pages
// Provides offline fallback, page shell caching, and API response caching
const OFFLINE_URL = '/client/offline'
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `portal-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `portal-runtime-${CACHE_VERSION}`

// Pages to pre-cache on install
const PRECACHE_URLS = [OFFLINE_URL]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch strategies ─────────────────────────────────────────────────────────

/**
 * Network-first with cache fallback.
 * Try the network; if it fails, serve from cache.
 * Used for homework pages (/hw/*) where freshness matters
 * but offline access is needed.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || caches.match(OFFLINE_URL)
  }
}

/**
 * Stale-while-revalidate.
 * Serve from cache immediately, then update cache in background.
 * Used for portal pages (/client/*) where perceived speed matters.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)

  return cached || (await fetchPromise) || caches.match(OFFLINE_URL)
}

/**
 * Cache-first.
 * Serve from cache; only go to network if not cached.
 * Used for static assets (JS/CSS bundles already versioned by Next.js).
 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // ── Navigation requests (HTML pages) ────────────────────────────────────
  if (e.request.mode === 'navigate') {
    // Homework pages: network-first (need fresh data but support offline)
    if (url.pathname.startsWith('/hw/')) {
      e.respondWith(networkFirst(e.request))
      return
    }

    // Client portal pages: stale-while-revalidate
    if (url.pathname.startsWith('/client/')) {
      e.respondWith(staleWhileRevalidate(e.request))
      return
    }

    // Other pages: network only with offline fallback
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // ── API responses (GET only) ────────────────────────────────────────────
  if (
    e.request.method === 'GET' &&
    url.pathname.startsWith('/api/homework')
  ) {
    e.respondWith(networkFirst(e.request))
    return
  }

  // ── Static assets (JS, CSS, images, fonts) ──────────────────────────────
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|png|svg|jpg|jpeg|webp|ico)$/)
  ) {
    e.respondWith(cacheFirst(e.request))
    return
  }
})
