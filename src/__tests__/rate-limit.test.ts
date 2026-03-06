import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function getModule() {
    return await import('@/lib/rate-limit')
  }

  it('allows requests under the limit', async () => {
    const { checkRateLimit } = await getModule()

    const result = checkRateLimit('user:1', 5, 60_000)

    expect(result.allowed).toBe(true)
  })

  it('blocks requests when the limit is reached', async () => {
    const { checkRateLimit } = await getModule()
    const key = 'user:block-test'
    const limit = 3
    const windowMs = 60_000

    for (let i = 0; i < limit; i++) {
      const r = checkRateLimit(key, limit, windowMs)
      expect(r.allowed).toBe(true)
    }

    const blocked = checkRateLimit(key, limit, windowMs)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('returns correct remaining count', async () => {
    const { checkRateLimit } = await getModule()
    const key = 'user:remaining'
    const limit = 5
    const windowMs = 60_000

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(key, limit, windowMs)
      expect(result.remaining).toBe(limit - (i + 1))
    }
  })

  it('tracks different keys independently', async () => {
    const { checkRateLimit } = await getModule()
    const limit = 2
    const windowMs = 60_000

    checkRateLimit('key:a', limit, windowMs)
    checkRateLimit('key:a', limit, windowMs)

    const blockedA = checkRateLimit('key:a', limit, windowMs)
    expect(blockedA.allowed).toBe(false)

    const allowedB = checkRateLimit('key:b', limit, windowMs)
    expect(allowedB.allowed).toBe(true)
    expect(allowedB.remaining).toBe(limit - 1)
  })

  it('allows requests again after the window expires', async () => {
    const { checkRateLimit } = await getModule()
    const key = 'user:expire'
    const limit = 2
    const windowMs = 10_000

    checkRateLimit(key, limit, windowMs)
    checkRateLimit(key, limit, windowMs)
    expect(checkRateLimit(key, limit, windowMs).allowed).toBe(false)

    vi.advanceTimersByTime(windowMs + 1)

    const afterExpiry = checkRateLimit(key, limit, windowMs)
    expect(afterExpiry.allowed).toBe(true)
    expect(afterExpiry.remaining).toBe(limit - 1)
  })

  it('returns a resetAt timestamp in the future', async () => {
    const { checkRateLimit } = await getModule()
    const nowSeconds = Math.floor(Date.now() / 1000)

    const result = checkRateLimit('user:reset', 5, 60_000)

    expect(result.resetAt).toBeGreaterThanOrEqual(nowSeconds)
    expect(result.resetAt).toBeLessThanOrEqual(nowSeconds + 61)
  })

  it('returns limit field matching the configured limit', async () => {
    const { checkRateLimit } = await getModule()

    const result = checkRateLimit('user:limit-field', 42, 60_000)
    expect(result.limit).toBe(42)
  })

  describe('RATE_LIMITS config', () => {
    it('has expected route entries', async () => {
      const { RATE_LIMITS } = await getModule()

      const expectedRoutes = [
        '/api/checkout',
        '/api/portal',
        '/api/homework',
        '/api/homework/pdf-download',
        '/api/import-worksheet',
        '/api/blog/upload-image',
        '/api/blog/reactions',
        '/api/demo-generate',
        '/api/generate-worksheet',
      ]

      for (const route of expectedRoutes) {
        expect(RATE_LIMITS).toHaveProperty(route)
        expect(RATE_LIMITS[route]).toHaveProperty('limit')
        expect(RATE_LIMITS[route]).toHaveProperty('windowMs')
        expect(RATE_LIMITS[route].limit).toBeGreaterThan(0)
        expect(RATE_LIMITS[route].windowMs).toBeGreaterThan(0)
      }
    })
  })
})
