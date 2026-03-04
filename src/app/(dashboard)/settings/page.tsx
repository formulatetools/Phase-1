import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/ui/profile-form'
import { PromoCodeInput } from '@/components/ui/promo-code-input'
import { SubscriptionDetails } from '@/components/ui/subscription-details'
import { ContributorProfileForm } from '@/components/ui/contributor-profile-form'
import { BlogDigestToggle } from '@/components/ui/blog-digest-toggle'
import { ChangePasswordForm } from '@/components/ui/change-password-form'
import { DeleteAccountSection } from '@/components/ui/delete-account-section'
import type { ContributorRoles, ContributorProfile } from '@/types/database'

export const metadata = {
  title: 'Settings — Formulate',
  description: 'Manage your profile, subscription, and practice settings.',
  openGraph: {
    title: 'Settings — Formulate',
    description: 'Manage your profile, subscription, and practice settings.',
  },
}

export default async function SettingsPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  // Fetch active subscription details
  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end, cancel_at_period_end, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-primary-400">Manage your account and preferences</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Profile</h2>
          <p className="mb-5 text-sm text-primary-400">Update your personal information</p>
          <ProfileForm
            initialName={profile.full_name || ''}
            initialEmail={profile.email}
          />
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Subscription</h2>
          <p className="mb-5 text-sm text-primary-400">Manage your plan and billing</p>
          <SubscriptionDetails profile={profile} subscription={subscription} />
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Account</h2>
          <p className="mb-5 text-sm text-primary-400">Your account details and preferences</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-primary-700">Email</p>
                <p className="text-xs text-primary-400">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-primary-700">Feature Requests</p>
                <p className="text-xs text-primary-400">Suggest and vote on new features</p>
              </div>
              <a
                href="/feature-requests"
                className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
              >
                View &rarr;
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Password</h2>
          <p className="mb-5 text-sm text-primary-400">Change your account password</p>
          <ChangePasswordForm />
        </div>

        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Email Preferences</h2>
          <p className="mb-5 text-sm text-primary-400">Control which emails you receive from Formulate</p>
          <BlogDigestToggle initialValue={profile.blog_digest_opt_in ?? false} />
        </div>

        {(() => {
          const cRoles = profile.contributor_roles as ContributorRoles | null
          const hasAnyRole = cRoles?.clinical_contributor || cRoles?.clinical_reviewer || cRoles?.content_writer
          return hasAnyRole ? (
            <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-primary-900">Contributor Profile</h2>
              <p className="mb-5 text-sm text-primary-400">How you appear on contributed worksheets</p>
              <ContributorProfileForm
                initialProfile={(profile.contributor_profile as ContributorProfile | null) || null}
              />
            </div>
          ) : null
        })()}

        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-primary-900">Refer a Colleague</h2>
              <p className="text-sm text-primary-400">Share Formulate with a colleague and earn rewards</p>
            </div>
            <a
              href="/referrals"
              className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
            >
              View &rarr;
            </a>
          </div>
        </div>

        {profile.subscription_tier === 'free' && (
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-primary-900">Promo Code</h2>
            <p className="mb-5 text-sm text-primary-400">Have a promo code? Enter it below to unlock features.</p>
            <PromoCodeInput mode="redeem" />
          </div>
        )}

        <DeleteAccountSection />
      </div>
    </div>
  )
}
