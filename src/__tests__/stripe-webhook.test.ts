import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Constants ────────────────────────────────────────────────────────
const FAKE_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const FAKE_SUB_ID = 'sub_abc123'
const FAKE_CUSTOMER_ID = 'cus_xyz789'
const FAKE_PRICE_ID = 'price_starter_monthly'
const FAKE_INVOICE_ID = 'inv_001'
const WEBHOOK_SECRET = 'whsec_test'

// ── Supabase admin mock builder ──────────────────────────────────────

function buildAdminMock() {
  const tableChains: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {}

  function makeChain(resolvedData: unknown = null) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    const resolvable = () => ({ data: resolvedData, error: null, count: null })

    for (const method of ['select', 'eq', 'in', 'insert', 'update', 'upsert', 'delete', 'gte']) {
      chain[method] = vi.fn().mockReturnValue(chain)
    }
    chain.single = vi.fn().mockResolvedValue(resolvable())
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(resolvable()))
    return chain
  }

  const mock = {
    from: vi.fn().mockImplementation((table: string) => {
      if (!tableChains[table]) {
        tableChains[table] = makeChain()
      }
      return tableChains[table]
    }),
    _tables: tableChains,
    _setTableData(table: string, data: unknown, extra?: { count?: number }) {
      const chain = makeChain(data)
      if (extra?.count !== undefined) {
        const resolvable = () => ({ data, error: null, count: extra.count })
        chain.single = vi.fn().mockResolvedValue(resolvable())
        chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(resolvable()))
      }
      tableChains[table] = chain
    },
  }

  return mock
}

// ── Module mocks ─────────────────────────────────────────────────────

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
    invoices: {
      retrieve: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/email-templates', () => ({
  abandonedCheckoutEmail: vi.fn().mockReturnValue({ subject: 'Come back!', html: '<p>come back</p>' }),
  subscriptionCancelledEmail: vi.fn().mockReturnValue({ subject: 'Cancelled', html: '<p>cancelled</p>' }),
  paymentFailedEmail: vi.fn().mockReturnValue({ subject: 'Payment failed', html: '<p>failed</p>' }),
}))

vi.mock('@/lib/stripe/config', () => ({
  STRIPE_PRICES: {
    starter: { monthly: 'price_starter_monthly', annual: 'price_starter_annual' },
    standard: { monthly: 'price_standard_monthly', annual: 'price_standard_annual' },
    professional: { monthly: 'price_professional_monthly', annual: 'price_professional_annual' },
  },
  TIER_LABELS: {
    free: 'Free',
    starter: 'Starter',
    standard: 'Practice',
    professional: 'Specialist',
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Import after mocks
import { POST } from '@/app/api/webhooks/stripe/route'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { subscriptionCancelledEmail, paymentFailedEmail, abandonedCheckoutEmail } from '@/lib/email-templates'

// ── Helpers ──────────────────────────────────────────────────────────

function makeRequest(body: string, signature: string | null = 'sig_valid'): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (signature !== null) {
    headers.set('stripe-signature', signature)
  }
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers,
  })
}

let eventCounter = 0
function makeStripeEvent(type: string, dataObject: Record<string, unknown>): { id: string; type: string; data: { object: Record<string, unknown> } } {
  eventCounter++
  return { id: `evt_test_${eventCounter}`, type, data: { object: dataObject } }
}

// ── Tests ────────────────────────────────────────────────────────────

describe('Stripe webhook handler', () => {
  let adminMock: ReturnType<typeof buildAdminMock>

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
    adminMock = buildAdminMock()
    vi.mocked(createAdminClient).mockReturnValue(adminMock as unknown as ReturnType<typeof createAdminClient>)
  })

  // ── Signature validation ───────────────────────────────────────────

  describe('signature validation', () => {
    it('rejects requests with missing signature (400)', async () => {
      const request = makeRequest('{}', null)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Missing signature')
    })

    it('rejects requests with invalid signature (400)', async () => {
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Webhook signature verification failed')
      })

      const request = makeRequest('{}', 'sig_bad')
      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid signature')
    })
  })

  // ── checkout.session.completed ─────────────────────────────────────

  describe('checkout.session.completed', () => {
    const NOW_SECS = Math.floor(Date.now() / 1000)

    function setupCheckoutEvent(metadataOverrides?: Record<string, string>) {
      const event = makeStripeEvent('checkout.session.completed', {
        metadata: { supabase_user_id: FAKE_USER_ID, ...metadataOverrides },
        subscription: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
      })

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
        items: { data: [{ price: { id: FAKE_PRICE_ID } }] },
        cancel_at_period_end: false,
        start_date: NOW_SECS,
        latest_invoice: FAKE_INVOICE_ID,
      } as never)

      vi.mocked(stripe.invoices.retrieve).mockResolvedValue({
        period_start: NOW_SECS,
        period_end: NOW_SECS + 30 * 86400,
      } as never)

      // Referral lookup returns nothing by default
      adminMock._setTableData('referrals', null)

      return event
    }

    it('creates subscription record, updates profile tier, and creates audit log', async () => {
      setupCheckoutEvent()
      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)

      // Subscription insert
      const subFrom = adminMock.from
      expect(subFrom).toHaveBeenCalledWith('subscriptions')
      const subsChain = adminMock._tables['subscriptions']
      expect(subsChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: FAKE_USER_ID,
          stripe_subscription_id: FAKE_SUB_ID,
          stripe_price_id: FAKE_PRICE_ID,
          status: 'active',
          cancel_at_period_end: false,
        })
      )

      // Profile update
      expect(subFrom).toHaveBeenCalledWith('profiles')
      const profileChain = adminMock._tables['profiles']
      expect(profileChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'starter',
          subscription_status: 'active',
          stripe_customer_id: FAKE_CUSTOMER_ID,
        })
      )
      expect(profileChain.eq).toHaveBeenCalledWith('id', FAKE_USER_ID)

      // Audit log
      expect(subFrom).toHaveBeenCalledWith('audit_log')
      const auditChain = adminMock._tables['audit_log']
      expect(auditChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: FAKE_USER_ID,
          action: 'create',
          entity_type: 'subscription',
          entity_id: FAKE_SUB_ID,
          metadata: { tier: 'starter', price_id: FAKE_PRICE_ID },
        })
      )
    })

    it('validates UUID format in metadata and skips non-UUID user_id', async () => {
      setupCheckoutEvent({ supabase_user_id: 'not-a-uuid' })
      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)
      // Should not attempt to insert subscriptions with invalid user id
      expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled()
    })

    it('skips when metadata has missing user_id', async () => {
      const event = makeStripeEvent('checkout.session.completed', {
        metadata: {},
        subscription: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled()
    })

    it('skips when price does not map to a known tier', async () => {
      const event = makeStripeEvent('checkout.session.completed', {
        metadata: { supabase_user_id: FAKE_USER_ID },
        subscription: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
        items: { data: [{ price: { id: 'price_unknown' } }] },
        cancel_at_period_end: false,
        start_date: NOW_SECS,
        latest_invoice: null,
      } as never)

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      // Should break before inserting subscription
      expect(adminMock._tables['subscriptions']).toBeUndefined()
    })
  })

  // ── customer.subscription.updated ──────────────────────────────────

  describe('customer.subscription.updated', () => {
    const NOW_SECS = Math.floor(Date.now() / 1000)

    function setupSubscriptionUpdatedEvent(overrides?: Record<string, unknown>) {
      const event = makeStripeEvent('customer.subscription.updated', {
        id: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
        status: 'active',
        items: { data: [{ price: { id: 'price_standard_monthly' } }] },
        cancel_at_period_end: false,
        start_date: NOW_SECS,
        latest_invoice: FAKE_INVOICE_ID,
        ...overrides,
      })

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      vi.mocked(stripe.invoices.retrieve).mockResolvedValue({
        period_start: NOW_SECS,
        period_end: NOW_SECS + 30 * 86400,
      } as never)

      // Profile lookup succeeds
      adminMock._setTableData('profiles', { id: FAKE_USER_ID })
    }

    it('updates subscription and profile on subscription update', async () => {
      setupSubscriptionUpdatedEvent()
      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)

      // Upsert subscription
      const subsChain = adminMock._tables['subscriptions']
      expect(subsChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: FAKE_USER_ID,
          stripe_subscription_id: FAKE_SUB_ID,
          stripe_price_id: 'price_standard_monthly',
          status: 'active',
          cancel_at_period_end: false,
        }),
        { onConflict: 'stripe_subscription_id' }
      )

      // Profile update to standard tier
      const profileChain = adminMock._tables['profiles']
      expect(profileChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'standard',
          subscription_status: 'active',
        })
      )
      expect(profileChain.eq).toHaveBeenCalledWith('id', FAKE_USER_ID)

      // Audit log
      const auditChain = adminMock._tables['audit_log']
      expect(auditChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: FAKE_USER_ID,
          action: 'update',
          entity_type: 'subscription',
          entity_id: FAKE_SUB_ID,
        })
      )
    })

    it('maps past_due Stripe status correctly', async () => {
      setupSubscriptionUpdatedEvent({ status: 'past_due' })
      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)

      const subsChain = adminMock._tables['subscriptions']
      expect(subsChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'past_due' }),
        expect.anything()
      )
    })

    it('skips profile update when no matching profile is found', async () => {
      const event = makeStripeEvent('customer.subscription.updated', {
        id: FAKE_SUB_ID,
        customer: 'cus_nonexistent',
        status: 'active',
        items: { data: [{ price: { id: 'price_standard_monthly' } }] },
        cancel_at_period_end: false,
        start_date: Math.floor(Date.now() / 1000),
        latest_invoice: null,
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      // Profile lookup returns null
      adminMock._setTableData('profiles', null)

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      // No subscription upsert should happen
      expect(adminMock._tables['subscriptions']).toBeUndefined()
    })
  })

  // ── customer.subscription.deleted ──────────────────────────────────

  describe('customer.subscription.deleted', () => {
    function setupDeletedEvent() {
      const event = makeStripeEvent('customer.subscription.deleted', {
        id: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
        items: { data: [{ price: { id: FAKE_PRICE_ID } }] },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      adminMock._setTableData('profiles', {
        id: FAKE_USER_ID,
        email: 'user@test.com',
        full_name: 'Test User',
      })
    }

    it('reverts to free tier and sends cancellation email', async () => {
      setupDeletedEvent()
      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)

      // Subscription status set to cancelled
      const subsChain = adminMock._tables['subscriptions']
      expect(subsChain.update).toHaveBeenCalledWith({ status: 'cancelled' })
      expect(subsChain.eq).toHaveBeenCalledWith('stripe_subscription_id', FAKE_SUB_ID)

      // Profile reverted to free
      const profileChain = adminMock._tables['profiles']
      expect(profileChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          monthly_download_count: 0,
        })
      )
      expect(profileChain.eq).toHaveBeenCalledWith('id', FAKE_USER_ID)

      // Audit log
      const auditChain = adminMock._tables['audit_log']
      expect(auditChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: FAKE_USER_ID,
          action: 'delete',
          entity_type: 'subscription',
          metadata: { reverted_to: 'free' },
        })
      )

      // Cancellation email sent with correct tier label
      expect(subscriptionCancelledEmail).toHaveBeenCalledWith('Test User', 'Starter')
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          emailType: 'subscription_cancelled',
        })
      )
    })

    it('does not send email when profile has no email', async () => {
      const event = makeStripeEvent('customer.subscription.deleted', {
        id: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
        items: { data: [{ price: { id: FAKE_PRICE_ID } }] },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      adminMock._setTableData('profiles', {
        id: FAKE_USER_ID,
        email: null,
        full_name: 'Test User',
      })

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      expect(sendEmail).not.toHaveBeenCalled()
    })
  })

  // ── invoice.payment_failed ─────────────────────────────────────────

  describe('invoice.payment_failed', () => {
    function setupPaymentFailedEvent() {
      const event = makeStripeEvent('invoice.payment_failed', {
        customer: FAKE_CUSTOMER_ID,
        parent: {
          subscription_details: { subscription: FAKE_SUB_ID },
        },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      adminMock._setTableData('profiles', {
        id: FAKE_USER_ID,
        email: 'user@test.com',
        full_name: 'Test User',
        subscription_tier: 'starter',
      })
    }

    it('sets past_due status on profile and subscription', async () => {
      setupPaymentFailedEvent()
      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)

      // Profile set to past_due
      const profileChain = adminMock._tables['profiles']
      expect(profileChain.update).toHaveBeenCalledWith({ subscription_status: 'past_due' })
      expect(profileChain.eq).toHaveBeenCalledWith('id', FAKE_USER_ID)

      // Subscription set to past_due
      const subsChain = adminMock._tables['subscriptions']
      expect(subsChain.update).toHaveBeenCalledWith({ status: 'past_due' })
      expect(subsChain.eq).toHaveBeenCalledWith('stripe_subscription_id', FAKE_SUB_ID)

      // Payment failed email
      expect(paymentFailedEmail).toHaveBeenCalledWith('Test User', 'Starter')
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          emailType: 'payment_failed',
        })
      )
    })

    it('skips when no matching profile is found', async () => {
      const event = makeStripeEvent('invoice.payment_failed', {
        customer: 'cus_nobody',
        parent: { subscription_details: { subscription: FAKE_SUB_ID } },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      adminMock._setTableData('profiles', null)

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      expect(sendEmail).not.toHaveBeenCalled()
    })
  })

  // ── checkout.session.expired ───────────────────────────────────────

  describe('checkout.session.expired', () => {
    function setupExpiredEvent() {
      const event = makeStripeEvent('checkout.session.expired', {
        metadata: { supabase_user_id: FAKE_USER_ID, tier: 'starter' },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      adminMock._setTableData('profiles', {
        email: 'user@test.com',
        full_name: 'Test User',
      })
    }

    it('sends abandoned checkout email when no recent sends', async () => {
      setupExpiredEvent()
      // Dedup check returns count 0
      adminMock._setTableData('audit_log', null, { count: 0 })

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)

      expect(abandonedCheckoutEmail).toHaveBeenCalledWith('Test User', 'Starter')
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          emailType: 'abandoned_checkout',
        })
      )
    })

    it('deduplicates abandoned checkout emails (no email if sent within 7 days)', async () => {
      setupExpiredEvent()
      // Dedup check returns count 1 (already sent recently)
      adminMock._setTableData('audit_log', null, { count: 1 })

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      expect(sendEmail).not.toHaveBeenCalled()
    })

    it('skips when metadata has no tier', async () => {
      const event = makeStripeEvent('checkout.session.expired', {
        metadata: { supabase_user_id: FAKE_USER_ID },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      expect(sendEmail).not.toHaveBeenCalled()
    })

    it('skips when profile has no email', async () => {
      const event = makeStripeEvent('checkout.session.expired', {
        metadata: { supabase_user_id: FAKE_USER_ID, tier: 'starter' },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      adminMock._setTableData('profiles', { email: null, full_name: null })

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      expect(sendEmail).not.toHaveBeenCalled()
    })
  })

  // ── Error resilience ───────────────────────────────────────────────

  describe('error resilience', () => {
    it('returns 200 even when handler throws (prevents Stripe retries)', async () => {
      const event = makeStripeEvent('checkout.session.completed', {
        metadata: { supabase_user_id: FAKE_USER_ID },
        subscription: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      // Make subscription retrieve throw
      vi.mocked(stripe.subscriptions.retrieve).mockRejectedValue(
        new Error('Stripe API error')
      )

      const response = await POST(makeRequest('{}'))

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.received).toBe(true)
    })

    it('returns 200 on database errors', async () => {
      const event = makeStripeEvent('customer.subscription.deleted', {
        id: FAKE_SUB_ID,
        customer: FAKE_CUSTOMER_ID,
        items: { data: [{ price: { id: FAKE_PRICE_ID } }] },
      })
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

      // Build a mock where the idempotency insert succeeds but the profile
      // lookup rejects with a DB error inside the try/catch block.
      const dbError = new Error('Database connection failed')
      let callCount = 0
      const errorMock = {
        from: vi.fn().mockImplementation(() => {
          callCount++
          const chain: Record<string, ReturnType<typeof vi.fn>> = {}
          for (const method of ['select', 'eq', 'in', 'insert', 'update', 'upsert', 'delete', 'gte']) {
            chain[method] = vi.fn().mockReturnValue(chain)
          }
          if (callCount === 1) {
            // First call: webhook_events insert (idempotency) — succeed
            chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) =>
              resolve({ data: null, error: null }))
          } else {
            // Subsequent calls: reject to simulate DB failure
            chain.single = vi.fn().mockRejectedValue(dbError)
          }
          return chain
        }),
      }

      vi.mocked(createAdminClient).mockReturnValue(errorMock as unknown as ReturnType<typeof createAdminClient>)

      const response = await POST(makeRequest('{}'))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.received).toBe(true)
    })
  })
})
