import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { ManageSubscriptionButton } from '@/components/ui/manage-subscription-button'

export const metadata = {
  title: 'Dashboard — Formulate',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const params = await searchParams
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch recently accessed worksheets
  const { data: recentAccess } = await supabase
    .from('worksheet_access_log')
    .select('worksheet_id, created_at, worksheets(title, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Deduplicate by worksheet_id
  const seen = new Set<string>()
  const recentWorksheets = (recentAccess || []).filter((item: { worksheet_id: string }) => {
    if (seen.has(item.worksheet_id)) return false
    seen.add(item.worksheet_id)
    return true
  })

  const isFreeTier = profile.subscription_tier === 'free'
  const usesRemaining = isFreeTier
    ? Math.max(0, TIER_LIMITS.free.monthlyUses - (profile.monthly_download_count ?? 0))
    : null

  const tierLabels: Record<string, string> = {
    free: 'Free',
    standard: 'Standard',
    professional: 'Professional',
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {params.checkout === 'success' && (
        <div className="mb-6 rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-700">
          Subscription activated successfully. Welcome to {tierLabels[profile.subscription_tier]}!
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900">
          Welcome{profile.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="mt-1 text-primary-500">Your Formulate dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription status */}
        <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-primary-500">Subscription</h2>
          <p className="mt-1 text-xl font-semibold text-primary-900">
            {tierLabels[profile.subscription_tier]} Plan
          </p>
          {isFreeTier ? (
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-primary-600">
                  {usesRemaining} of {TIER_LIMITS.free.monthlyUses} tools remaining
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-100">
                <div
                  className="h-full rounded-full bg-accent-500 transition-all"
                  style={{
                    width: `${((TIER_LIMITS.free.monthlyUses - (usesRemaining ?? 0)) / TIER_LIMITS.free.monthlyUses) * 100}%`,
                  }}
                />
              </div>
              <Link
                href="/pricing"
                className="mt-3 inline-block text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Upgrade for unlimited access &rarr;
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              <ManageSubscriptionButton />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-primary-500">Quick Actions</h2>
          <div className="mt-3 space-y-2">
            <Link
              href="/worksheets"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-50"
            >
              <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Browse Worksheet Library
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-50"
            >
              <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Profile Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Recently accessed worksheets */}
      {recentWorksheets.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-primary-900">
            Recently Used
          </h2>
          <div className="space-y-2">
            {recentWorksheets.map((item: { worksheet_id: string; created_at: string; worksheets: { title: string; slug: string }[] }) => {
              const ws = item.worksheets?.[0]
              return (
              <Link
                key={item.worksheet_id}
                href={`/worksheets/${ws?.slug}`}
                className="flex items-center justify-between rounded-lg border border-primary-100 bg-white px-4 py-3 transition-colors hover:bg-primary-50"
              >
                <span className="text-sm font-medium text-primary-700">
                  {ws?.title}
                </span>
                <span className="text-xs text-primary-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </Link>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
