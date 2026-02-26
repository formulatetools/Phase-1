import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/ui/profile-form'
import { PromoCodeInput } from '@/components/ui/promo-code-input'
import { SubscriptionDetails } from '@/components/ui/subscription-details'
import { ContributorProfileForm } from '@/components/ui/contributor-profile-form'
import { BlogDigestToggle } from '@/components/ui/blog-digest-toggle'
import type { ContributorRoles, ContributorProfile } from '@/types/database'

export const metadata = {
  title: 'Settings — Formulate',
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

        {profile.subscription_tier === 'free' && (
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-primary-900">Promo Code</h2>
            <p className="mb-5 text-sm text-primary-400">Have a promo code? Enter it below to unlock features.</p>
            <PromoCodeInput mode="redeem" />
          </div>
        )}
      </div>
    </div>
  )
}
