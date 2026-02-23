import Link from 'next/link'
import { TIER_LABELS, TIER_LIMITS } from '@/lib/stripe/config'
import { ManageSubscriptionButton } from '@/components/ui/manage-subscription-button'

interface Profile {
  subscription_status: string
  subscription_tier: string
  monthly_download_count: number
}

interface Subscription {
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  status: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function SubscriptionDetails({
  profile,
  subscription,
}: {
  profile: Profile
  subscription: Subscription | null
}) {
  const tierLabel = TIER_LABELS[profile.subscription_tier] || profile.subscription_tier
  const isFreeTier = profile.subscription_tier === 'free'
  const isPaid = profile.subscription_status === 'active' || profile.subscription_status === 'past_due'

  return (
    <div className="space-y-4">
      {/* Tier badge + status */}
      <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-primary-700">Current Plan</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                isFreeTier ? 'bg-primary-100 text-primary-500' : 'bg-brand/10 text-brand-dark'
              }`}>
                {tierLabel}
              </span>
              {profile.subscription_status === 'past_due' && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                  Past due
                </span>
              )}
            </div>
          </div>
        </div>
        {isFreeTier ? (
          <Link
            href="/pricing"
            className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            Upgrade &rarr;
          </Link>
        ) : (
          <Link
            href="/pricing"
            className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            Change plan &rarr;
          </Link>
        )}
      </div>

      {/* Billing period for paid users */}
      {isPaid && subscription && (
        <div className="rounded-xl bg-primary-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700">Billing Period</p>
              <p className="mt-0.5 text-xs text-primary-400">
                {formatDate(subscription.current_period_start)} &ndash; {formatDate(subscription.current_period_end)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-primary-400">Next billing date</p>
              <p className="text-sm font-medium text-primary-700">{formatDate(subscription.current_period_end)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation warning */}
      {subscription?.cancel_at_period_end && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Plan set to cancel</p>
            <p className="text-xs text-amber-700">
              Your {tierLabel} plan will cancel on {formatDate(subscription.current_period_end)}.
              You&apos;ll keep access until then.
            </p>
          </div>
        </div>
      )}

      {/* Past due warning */}
      {profile.subscription_status === 'past_due' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Payment failed</p>
            <p className="text-xs text-red-700">
              Your last payment didn&apos;t go through. Please update your payment method to keep your {tierLabel} access.
            </p>
          </div>
        </div>
      )}

      {/* Free tier usage */}
      {isFreeTier && (
        <div className="rounded-xl bg-primary-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary-700">Monthly Usage</p>
            <p className="text-sm font-medium text-primary-700">
              {profile.monthly_download_count}/{TIER_LIMITS.free.monthlyUses} used
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-100">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.min(100, (profile.monthly_download_count / TIER_LIMITS.free.monthlyUses) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Manage billing button for paid users */}
      {isPaid && (
        <div className="flex items-center gap-3 pt-1">
          <ManageSubscriptionButton />
          <span className="text-xs text-primary-400">Invoices, payment methods &amp; cancellation</span>
        </div>
      )}
    </div>
  )
}
