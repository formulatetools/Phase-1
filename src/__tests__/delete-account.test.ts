import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-123', email: 'test@example.com' }
const mockDeleteUser = vi.fn()

/**
 * Build a fluent Supabase chain mock that tracks calls per table.
 * Each .from(table) returns an independent chain so mocks don't collide.
 */
function buildAdminMock(overrides: {
  profileData?: Record<string, unknown> | null
  queueData?: { id: string }[]
  deleteUserError?: { message: string } | null
} = {}) {
  const {
    profileData = null,
    queueData = [],
    deleteUserError = null,
  } = overrides

  // Create a per-table chain factory
  function makeChain(resolvedData: unknown = null, resolvedError: unknown = null) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    const resolvable = () => ({ data: resolvedData, error: resolvedError })
    const asyncResolvable = () => Promise.resolve(resolvable())

    // Every method returns chain (for fluent chaining) but terminal ones resolve data
    for (const method of ['select', 'eq', 'in', 'is', 'delete', 'update']) {
      chain[method] = vi.fn().mockReturnValue(chain)
    }
    // single() is the terminal for profile query
    chain.single = vi.fn().mockResolvedValue(resolvable())
    // Make the chain itself thenable so `await admin.from().delete().eq()` works
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(resolvable()))
    return chain
  }

  const tableChains: Record<string, ReturnType<typeof makeChain>> = {
    profiles: makeChain(profileData),
    plan_queues: makeChain(queueData),
    plan_queue_items: makeChain(null),
    blog_reactions: makeChain(null),
    blog_posts: makeChain(null),
    worksheet_reviews: makeChain(null),
    worksheets: makeChain(null),
  }

  mockDeleteUser.mockResolvedValue({ error: deleteUserError })

  return {
    from: vi.fn().mockImplementation((table: string) => {
      return tableChains[table] || makeChain()
    }),
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  }
}

// ── Module mocks ───────────────────────────────────────────────────────

vi.mock('@/lib/supabase/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    subscriptions: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      cancel: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Import after mocks
import { deleteAccount } from '@/app/(dashboard)/settings/actions'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

// ── Tests ──────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: null,
      profile: null,
    } as Awaited<ReturnType<typeof getCurrentUser>>)

    const result = await deleteAccount()
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('succeeds for a user with no Stripe or queues', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: mockUser,
      profile: null,
    } as Awaited<ReturnType<typeof getCurrentUser>>)
    vi.mocked(createAdminClient).mockReturnValue(
      buildAdminMock() as unknown as ReturnType<typeof createAdminClient>
    )

    const result = await deleteAccount()
    expect(result).toEqual({})
    expect(mockDeleteUser).toHaveBeenCalledWith('user-123')
  })

  it('cancels active Stripe subscriptions before deleting', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: mockUser,
      profile: null,
    } as Awaited<ReturnType<typeof getCurrentUser>>)
    vi.mocked(createAdminClient).mockReturnValue(
      buildAdminMock({
        profileData: { stripe_customer_id: 'cus_abc' },
      }) as unknown as ReturnType<typeof createAdminClient>
    )
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1' }, { id: 'sub_2' }],
    } as Awaited<ReturnType<typeof stripe.subscriptions.list>>)

    await deleteAccount()

    expect(stripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_abc',
      status: 'active',
    })
    expect(stripe.subscriptions.cancel).toHaveBeenCalledTimes(2)
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_1')
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_2')
  })

  it('continues deletion even if Stripe cancellation fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: mockUser,
      profile: null,
    } as Awaited<ReturnType<typeof getCurrentUser>>)
    vi.mocked(createAdminClient).mockReturnValue(
      buildAdminMock({
        profileData: { stripe_customer_id: 'cus_abc' },
      }) as unknown as ReturnType<typeof createAdminClient>
    )
    vi.mocked(stripe.subscriptions.list).mockRejectedValue(new Error('Stripe down'))

    const result = await deleteAccount()

    // Should still succeed (Stripe errors are non-blocking)
    expect(result).toEqual({})
    expect(mockDeleteUser).toHaveBeenCalledWith('user-123')
  })

  it('returns error if auth user deletion fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: mockUser,
      profile: null,
    } as Awaited<ReturnType<typeof getCurrentUser>>)
    vi.mocked(createAdminClient).mockReturnValue(
      buildAdminMock({
        deleteUserError: { message: 'DB error' },
      }) as unknown as ReturnType<typeof createAdminClient>
    )

    const result = await deleteAccount()

    expect(result).toEqual({
      error: 'Failed to delete your account. Please contact support.',
    })
  })

  it('returns error for unexpected exceptions inside the pipeline', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: mockUser,
      profile: null,
    } as Awaited<ReturnType<typeof getCurrentUser>>)

    // Make the admin client's from() throw inside the try block
    const adminMock = buildAdminMock()
    adminMock.from = vi.fn().mockImplementation(() => {
      throw new Error('Connection failed')
    })
    vi.mocked(createAdminClient).mockReturnValue(
      adminMock as unknown as ReturnType<typeof createAdminClient>
    )

    const result = await deleteAccount()

    expect(result).toEqual({
      error: 'An unexpected error occurred. Please contact support.',
    })
  })
})
