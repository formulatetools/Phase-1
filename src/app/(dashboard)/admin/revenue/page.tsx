import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_PRICES, TIER_LABELS } from '@/lib/stripe/config'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { TierDistributionChart } from '@/components/admin/tier-distribution-chart'

export const metadata = { title: 'Revenue Analytics — Admin — Formulate' }

/* ─── Helpers ─────────────────────────────────────────────────────────── */

interface Subscription {
  stripe_price_id: string
  status: string
  created_at: string
  updated_at: string
}

const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID!,
    annual: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID!,
  },
  standard: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STANDARD_MONTHLY_PRICE_ID!,
    annual: process.env.NEXT_PUBLIC_STRIPE_STANDARD_ANNUAL_PRICE_ID!,
  },
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!,
    annual: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID!,
  },
}

function getTierFromPriceId(priceId: string): string | null {
  for (const [tier, prices] of Object.entries(STRIPE_PRICE_IDS)) {
    if (priceId === prices.monthly || priceId === prices.annual) return tier
  }
  return null
}

function isAnnualPrice(priceId: string): boolean {
  for (const prices of Object.values(STRIPE_PRICE_IDS)) {
    if (priceId === prices.annual) return true
  }
  return false
}

function getMonthlyValue(priceId: string): number {
  const tier = getTierFromPriceId(priceId) as keyof typeof TIER_PRICES | null
  if (!tier || !TIER_PRICES[tier]) return 0
  if (isAnnualPrice(priceId)) return TIER_PRICES[tier].annual / 12
  return TIER_PRICES[tier].monthly
}

/** Build MRR over last 12 months from subscription events */
function buildMRRTimeline(
  subscriptions: Subscription[],
): { month: string; mrr: number }[] {
  const now = new Date()
  const months: { month: string; mrr: number }[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = d.toISOString().slice(0, 7) // YYYY-MM
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)

    // Subscriptions active as of month end
    let mrr = 0
    for (const sub of subscriptions) {
      const created = new Date(sub.created_at)
      const updated = new Date(sub.updated_at)

      // Was this subscription active at month end?
      if (created <= monthEnd) {
        if (sub.status === 'active' || updated > monthEnd) {
          mrr += getMonthlyValue(sub.stripe_price_id)
        }
      }
    }

    months.push({ month: monthKey, mrr: Math.round(mrr * 100) / 100 })
  }

  return months
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default async function AdminRevenuePage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: allSubscriptions },
    { data: activeSubscriptions },
    { count: cancelledLast30d },
    { data: recentSubEvents },
    { data: tierCounts },
  ] = await Promise.all([
    // All subscriptions (for timeline)
    supabase
      .from('subscriptions')
      .select('stripe_price_id, status, created_at, updated_at')
      .order('created_at', { ascending: true }),

    // Currently active
    supabase
      .from('subscriptions')
      .select('stripe_price_id, status')
      .eq('status', 'active'),

    // Cancelled in last 30d
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('updated_at', thirtyDaysAgo),

    // Recent subscription audit events
    supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', 'subscription')
      .order('created_at', { ascending: false })
      .limit(20),

    // Tier distribution from profiles
    supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('role', 'therapist'),
  ])

  // Calculate metrics
  const subs = (activeSubscriptions || []) as { stripe_price_id: string; status: string }[]
  let mrr = 0
  let monthlyCount = 0
  let annualCount = 0

  for (const sub of subs) {
    mrr += getMonthlyValue(sub.stripe_price_id)
    if (isAnnualPrice(sub.stripe_price_id)) {
      annualCount++
    } else {
      monthlyCount++
    }
  }
  mrr = Math.round(mrr * 100) / 100
  const arr = Math.round(mrr * 12 * 100) / 100
  const totalPaid = subs.length
  const arpu = totalPaid > 0 ? Math.round((mrr / totalPaid) * 100) / 100 : 0
  const annualPct = totalPaid > 0 ? Math.round((annualCount / totalPaid) * 100) : 0

  // MRR timeline
  const mrrTimeline = buildMRRTimeline((allSubscriptions || []) as Subscription[])

  // Tier distribution
  const tierMap: Record<string, number> = { Free: 0, Starter: 0, Practice: 0, Specialist: 0 }
  for (const p of (tierCounts || []) as { subscription_tier: string }[]) {
    const label = TIER_LABELS[p.subscription_tier] || 'Free'
    tierMap[label] = (tierMap[label] || 0) + 1
  }
  const tierDistribution = Object.entries(tierMap).map(([tier, count]) => ({ tier, count }))

  // Churned users
  const churnRate = totalPaid > 0
    ? Math.round(((cancelledLast30d ?? 0) / (totalPaid + (cancelledLast30d ?? 0))) * 100)
    : 0

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Revenue</h1>
        <p className="mt-1 text-primary-400">Subscription metrics and revenue trends</p>
      </div>

      <AdminTabs />

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* MRR */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">£{mrr.toFixed(0)}</p>
          <p className="mt-0.5 text-sm text-primary-400">MRR</p>
        </div>

        {/* ARR */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">£{arr.toFixed(0)}</p>
          <p className="mt-0.5 text-sm text-primary-400">ARR</p>
        </div>

        {/* Total Subscribers */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{totalPaid}</p>
          <p className="mt-0.5 text-sm text-primary-400">Subscribers</p>
        </div>

        {/* ARPU */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">£{arpu.toFixed(2)}</p>
          <p className="mt-0.5 text-sm text-primary-400">ARPU</p>
        </div>

        {/* Annual % */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{annualPct}%</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Annual
            <span className="text-primary-300"> · {annualCount} of {totalPaid}</span>
          </p>
        </div>

        {/* Churn */}
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{churnRate}%</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Churn (30d)
            <span className="text-primary-300"> · {cancelledLast30d ?? 0} lost</span>
          </p>
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <RevenueChart data={mrrTimeline} />
        <TierDistributionChart data={tierDistribution} />
      </div>

      {/* ── Recent subscription events ──────────────────────────────── */}
      <div className="rounded-2xl border border-primary-100 bg-white shadow-sm">
        <div className="border-b border-primary-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-primary-900">
            Recent Subscription Events
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-50 bg-primary-50/50">
              <tr>
                <th className="px-6 py-3 font-medium text-primary-500">Event</th>
                <th className="px-6 py-3 font-medium text-primary-500">Tier</th>
                <th className="px-6 py-3 font-medium text-primary-500">Status</th>
                <th className="px-6 py-3 font-medium text-primary-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {(recentSubEvents || []).map(
                (e: { id: string; action: string; metadata: Record<string, string> | null; created_at: string }) => {
                  const tier = e.metadata?.tier
                  const status = e.metadata?.status
                  return (
                    <tr key={e.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium capitalize text-primary-900">
                        {e.action === 'create' ? 'New subscription' : e.action === 'update' ? 'Updated' : e.action === 'delete' ? 'Cancelled' : e.action}
                      </td>
                      <td className="px-6 py-3 text-primary-600">
                        {tier ? (TIER_LABELS[tier] || tier) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        {status && (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            status === 'active' ? 'bg-green-50 text-green-700' :
                            status === 'past_due' ? 'bg-amber-50 text-amber-700' :
                            status === 'cancelled' ? 'bg-red-50 text-red-600' :
                            'bg-primary-100 text-primary-600'
                          }`}>
                            {status}
                          </span>
                        )}
                        {!status && <span className="text-primary-400">—</span>}
                      </td>
                      <td className="px-6 py-3 text-primary-500">
                        {new Date(e.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                },
              )}
              {(!recentSubEvents || recentSubEvents.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-primary-400">
                    No subscription events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
