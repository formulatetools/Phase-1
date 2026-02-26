import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LABELS } from '@/lib/stripe/config'
import { toggleContributorRole } from '../actions'
import type { ContributorRoles, ContributorProfile, ContributorRole } from '@/types/database'

export const metadata = { title: 'User Detail — Admin — Formulate' }

const ROLE_CONFIG: {
  key: ContributorRole
  label: string
  description: string
  badgeClass: string
}[] = [
  {
    key: 'clinical_contributor',
    label: 'Clinical Contributor',
    description: 'Can build worksheets and submit them to the public library',
    badgeClass: 'bg-green-50 text-green-700',
  },
  {
    key: 'clinical_reviewer',
    label: 'Clinical Reviewer',
    description: 'Can review worksheets submitted by other contributors',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'content_writer',
    label: 'Content Writer',
    description: 'Can write clinical context for existing worksheets',
    badgeClass: 'bg-purple-50 text-purple-700',
  },
]

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, subscription_tier, subscription_status, contributor_roles, contributor_profile, contributor_agreement_accepted_at, created_at')
    .eq('id', id)
    .single()

  if (!targetUser) notFound()

  const roles = (targetUser.contributor_roles as ContributorRoles | null) || {
    clinical_contributor: false,
    clinical_reviewer: false,
    content_writer: false,
  }

  const contributorProfile = targetUser.contributor_profile as ContributorProfile | null

  const tierColors: Record<string, string> = {
    free: 'bg-primary-100 text-primary-600',
    starter: 'bg-amber-50 text-amber-700',
    standard: 'bg-brand/10 text-brand-dark',
    professional: 'bg-purple-50 text-purple-700',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    past_due: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-600',
    free: 'bg-primary-100 text-primary-600',
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Back link */}
      <div className="mb-2">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Users
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
          {targetUser.full_name || 'No name'}
        </h1>
        <p className="mt-1 text-primary-400">{targetUser.email}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ── User Info ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-primary-900">Account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-primary-50 px-4 py-3">
              <p className="text-xs font-medium text-primary-500">Plan</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[targetUser.subscription_tier] || tierColors.free}`}>
                {TIER_LABELS[targetUser.subscription_tier] || targetUser.subscription_tier}
              </span>
            </div>
            <div className="rounded-xl bg-primary-50 px-4 py-3">
              <p className="text-xs font-medium text-primary-500">Status</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[targetUser.subscription_status] || statusColors.free}`}>
                {targetUser.subscription_status}
              </span>
            </div>
            <div className="rounded-xl bg-primary-50 px-4 py-3">
              <p className="text-xs font-medium text-primary-500">Role</p>
              <p className="mt-1 text-sm font-medium text-primary-900 capitalize">{targetUser.role}</p>
            </div>
            <div className="rounded-xl bg-primary-50 px-4 py-3">
              <p className="text-xs font-medium text-primary-500">Joined</p>
              <p className="mt-1 text-sm font-medium text-primary-900">
                {new Date(targetUser.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Contributor Roles ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-primary-900">Contributor Roles</h2>
          <p className="mb-5 text-sm text-primary-400">
            Toggle roles to grant or revoke contributor access. Granting a role gives free Practice-tier access.
          </p>
          <div className="space-y-3">
            {ROLE_CONFIG.map(({ key, label, description, badgeClass }) => {
              const isActive = roles[key]
              const boundToggle = toggleContributorRole.bind(null, targetUser.id, key)
              const formAction = async () => { 'use server'; await boundToggle() }

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                    isActive ? 'bg-green-50/50 border border-green-200' : 'bg-primary-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary-900">{label}</p>
                      {isActive && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-primary-400">{description}</p>
                  </div>
                  <form action={formAction}>
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-primary-800 text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300'
                      }`}
                    >
                      {isActive ? 'Revoke' : 'Grant'}
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Contributor Profile (if any role is active) ─────────── */}
        {Object.values(roles).some(Boolean) && (
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-primary-900">Contributor Profile</h2>
            <p className="mb-4 text-sm text-primary-400">
              How this contributor appears on published worksheets
            </p>
            {contributorProfile ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Display Name</p>
                  <p className="mt-0.5 text-sm text-primary-900">{contributorProfile.display_name}</p>
                </div>
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Professional Title</p>
                  <p className="mt-0.5 text-sm text-primary-900">{contributorProfile.professional_title}</p>
                </div>
                {contributorProfile.bio && (
                  <div className="rounded-xl bg-primary-50 px-4 py-3">
                    <p className="text-xs font-medium text-primary-500">Bio</p>
                    <p className="mt-0.5 text-sm text-primary-900">{contributorProfile.bio}</p>
                  </div>
                )}
                {contributorProfile.profile_url && (
                  <div className="rounded-xl bg-primary-50 px-4 py-3">
                    <p className="text-xs font-medium text-primary-500">Profile URL</p>
                    <p className="mt-0.5 text-sm text-primary-900">{contributorProfile.profile_url}</p>
                  </div>
                )}
                <div className="rounded-xl border border-dashed border-primary-200 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Attribution Preview</p>
                  <p className="mt-1 text-sm text-primary-900">
                    Contributed by <strong>{contributorProfile.display_name}</strong>, {contributorProfile.professional_title}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This contributor has not set up their profile yet. They can do this in Settings.
              </p>
            )}

            {targetUser.contributor_agreement_accepted_at ? (
              <p className="mt-3 text-xs text-primary-400">
                Contributor agreement accepted on{' '}
                {new Date(targetUser.contributor_agreement_accepted_at as string).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            ) : (
              <p className="mt-3 text-xs text-amber-600">
                Contributor agreement not yet accepted
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
