import Link from 'next/link'
import { TIER_LABELS } from '@/lib/stripe/config'
import { buttonVariants } from '@/components/ui/button-variants'

interface ExpiredTrialBannerProps {
  latestRedemption: {
    access_expires_at: string
    promo_codes: { tier: string } | { tier: string }[] | null
  } | null
  isFreeTier: boolean
}

export function ExpiredTrialBanner({ latestRedemption, isFreeTier }: ExpiredTrialBannerProps) {
  if (!isFreeTier || !latestRedemption) return null
  if (new Date(latestRedemption.access_expires_at) >= new Date()) return null

  const promoTier = Array.isArray(latestRedemption.promo_codes)
    ? latestRedemption.promo_codes[0]?.tier
    : latestRedemption.promo_codes?.tier

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="font-medium text-primary-900">Your free trial has ended</p>
        <p className="text-sm text-primary-600">
          Upgrade from &pound;4.99/mo to keep your {promoTier ? TIER_LABELS[promoTier] : 'premium'} features.
        </p>
      </div>
      <Link
        href="/pricing"
        className={buttonVariants.accent()}
      >
        View plans
      </Link>
    </div>
  )
}
