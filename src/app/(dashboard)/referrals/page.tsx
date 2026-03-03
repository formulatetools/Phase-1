import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getOrCreateReferralCode, getReferralStats } from './actions'
import { ReferralLinkCard } from '@/components/ui/referral-link-card'

export const metadata = {
  title: 'Referrals — Formulate',
  description: 'Share Formulate with colleagues and earn rewards for each referral.',
  openGraph: {
    title: 'Referrals — Formulate',
    description: 'Share Formulate with colleagues and earn rewards for each referral.',
  },
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
        <p className="mt-1 text-primary-400">Share Formulate and both get a free month of Starter</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Referral link card */}
        {referralLink && code && (
          <ReferralLinkCard referralLink={referralLink} code={code} />
        )}

        {/* Reward banner */}
        <div className="rounded-2xl border border-brand/20 bg-brand-light p-6">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-brand mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-brand-text">
                You and your friend both get <strong>1 free month of Starter</strong> when they sign up
              </p>
              <p className="mt-1 text-xs text-brand-text/70">
                Unlimited worksheets, PDF exports, and up to 8 clients. Refer more friends to stack months!
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
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
                <p className="text-xs text-primary-400">Your friend creates a free Formulate account using your link</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">Both get rewarded</p>
                <p className="text-xs text-primary-400">You both instantly receive 1 free month of Starter tier</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-primary-900">Your referral stats</h2>
          <div className="grid grid-cols-3 gap-4">
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
            <div className="rounded-xl bg-brand-light p-4 text-center">
              <p className="text-2xl font-bold text-brand">{stats.rewarded}</p>
              <p className="mt-0.5 text-xs text-primary-400">
                Month{stats.rewarded !== 1 ? 's' : ''} earned
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
