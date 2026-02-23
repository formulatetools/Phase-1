import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TIER_LABELS } from '@/lib/stripe/config'
import { ProfileForm } from '@/components/ui/profile-form'

export const metadata = {
  title: 'Settings — Formulate',
}

export default async function SettingsPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-primary-400">Manage your account and preferences</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Profile</h2>
          <p className="mb-5 text-sm text-primary-400">Update your personal information</p>
          <ProfileForm
            initialName={profile.full_name || ''}
            initialEmail={profile.email}
          />
        </div>

        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Account</h2>
          <p className="mb-5 text-sm text-primary-400">Manage your subscription and account settings</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-primary-700">Subscription</p>
                <p className="text-xs text-primary-400">{TIER_LABELS[profile.subscription_tier] || profile.subscription_tier} plan</p>
              </div>
              <a
                href="/pricing"
                className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
              >
                {profile.subscription_tier === 'free' ? 'Upgrade' : 'Manage'} →
              </a>
            </div>
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
      </div>
    </div>
  )
}
