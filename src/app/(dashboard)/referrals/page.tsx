import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getOrCreateReferralCode, getReferralStats } from './actions'
import { ReferralLinkCard } from '@/components/ui/referral-link-card'

export const metadata = {
  title: 'Referrals — Formulate',
}

export default async function ReferralsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const [codeResult, stats] = await Promise.all([
    getOrCreateReferralCode(),
    getReferralStats(),
  ])

  const code = 'code' in codeResult ? codeResult.code : null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'
  const referralLink = code ? `${appUrl}/signup?ref=${code}` : null

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Referrals</h1>
        <p className="mt-1 text-primary-400">Share Formulate and earn rewards when friends subscribe</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Referral link card */}
        {referralLink && code && (
          <ReferralLinkCard referralLink={referralLink} code={code} />
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-primary-900">How it works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">Share your link</p>
                <p className="text-xs text-primary-400">Send your unique referral link to colleagues</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">They sign up</p>
                <p className="text-xs text-primary-400">Your friend creates a free Formulate account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">Both benefit</p>
                <p className="text-xs text-primary-400">When they subscribe, you both get rewarded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-primary-900">Your referral stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-primary-50 p-4 text-center">
              <p className="text-2xl font-bold text-primary-900">{stats.total}</p>
              <p className="mt-0.5 text-xs text-primary-400">
                Friend{stats.total !== 1 ? 's' : ''} referred
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4 text-center">
              <p className="text-2xl font-bold text-primary-900">{stats.converted}</p>
              <p className="mt-0.5 text-xs text-primary-400">
                Converted to paid
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
