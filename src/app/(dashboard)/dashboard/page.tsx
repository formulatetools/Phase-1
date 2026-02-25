import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS, TIER_LABELS } from '@/lib/stripe/config'
import { ManageSubscriptionButton } from '@/components/ui/manage-subscription-button'
import { AnnualUpgradeBanner } from '@/components/ui/annual-upgrade-banner'
import { activityLabel, activityIcon, timeAgo, type ActivityItem } from '@/lib/utils/activity'
import { DashboardTour } from '@/components/onboarding/dashboard-tour'
import { OnboardingChecklist } from '@/components/onboarding/onboarding-checklist'
import { PromoAutoRedeem } from '@/components/ui/promo-auto-redeem'

export const metadata = {
  title: 'Dashboard — Formulate',
}

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // ── Parallel data fetches ──────────────────────────────────────────────
  const [
    { data: recentAccess },
    { count: activeClientCount },
    { count: dischargedClientCount },
    { count: activeAssignmentCount },
    { count: completedAssignmentCount },
    { count: pendingReviewCount },
    { data: recentActivity },
    { count: userExportCount },
    { data: latestRedemption },
    { data: activeSubscription },
    { count: activeSuperviseeCount },
    { data: contributorSubmissions },
    { data: reviewQueue },
    { data: myContentItems },
    { data: availableContent },
  ] = await Promise.all([
    // Recently accessed worksheets
    supabase
      .from('worksheet_access_log')
      .select('worksheet_id, created_at, worksheets(title, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    // Active clients count (clinical only)
    supabase
      .from('therapeutic_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .eq('status', 'active')
      .eq('relationship_type', 'clinical')
      .is('deleted_at', null),

    // Discharged clients count (clinical only)
    supabase
      .from('therapeutic_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .eq('status', 'discharged')
      .eq('relationship_type', 'clinical')
      .is('deleted_at', null),

    // Active assignments (assigned or in_progress)
    supabase
      .from('worksheet_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .in('status', ['assigned', 'in_progress'])
      .is('deleted_at', null),

    // Completed assignments (all time)
    supabase
      .from('worksheet_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .in('status', ['completed', 'reviewed'])
      .is('deleted_at', null),

    // Pending review (completed but not yet reviewed)
    supabase
      .from('worksheet_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .eq('status', 'completed')
      .is('deleted_at', null),

    // Recent activity from audit log
    supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', user.id)
      .in('action', ['create', 'assign', 'read', 'export', 'gdpr_erasure'])
      .order('created_at', { ascending: false })
      .limit(8),

    // User export count (for onboarding checklist)
    supabase
      .from('worksheet_access_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('access_type', 'export'),

    // Latest promo redemption (for expired trial banner)
    supabase
      .from('promo_redemptions')
      .select('access_expires_at, promo_codes(tier)')
      .eq('user_id', user.id)
      .order('access_expires_at', { ascending: false })
      .limit(1)
      .single(),

    // Active subscription (for annual upgrade banner)
    supabase
      .from('subscriptions')
      .select('stripe_price_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    // Active supervisees count
    supabase
      .from('therapeutic_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .eq('status', 'active')
      .eq('relationship_type', 'supervision')
      .is('deleted_at', null),

    // Contributor submissions (only for clinical_contributors)
    (profile.contributor_roles as { clinical_contributor?: boolean } | null)?.clinical_contributor
      ? supabase
          .from('worksheets')
          .select('id, title, slug, library_status, submitted_at, admin_feedback')
          .eq('submitted_by', user.id)
          .not('library_status', 'is', null)
          .is('deleted_at', null)
          .order('submitted_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: null }),

    // Review queue (only for clinical_reviewers)
    (profile.contributor_roles as { clinical_reviewer?: boolean } | null)?.clinical_reviewer
      ? supabase
          .from('worksheet_reviews')
          .select('id, worksheet_id, assigned_at, completed_at, worksheets(title)')
          .eq('reviewer_id', user.id)
          .order('assigned_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: null }),

    // Content writer: my claimed/submitted worksheets (only for content_writers)
    (profile.contributor_roles as { content_writer?: boolean } | null)?.content_writer
      ? supabase
          .from('worksheets')
          .select('id, title, slug, clinical_context_status, clinical_context_feedback')
          .eq('clinical_context_author', user.id)
          .not('clinical_context_status', 'is', null)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: null }),

    // Content writer: available worksheets needing content (only for content_writers)
    (profile.contributor_roles as { content_writer?: boolean } | null)?.content_writer
      ? supabase
          .from('worksheets')
          .select('id, title, slug')
          .eq('is_published', true)
          .is('clinical_context', null)
          .is('clinical_context_status', null)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
  ])

  // Deduplicate recently accessed worksheets
  const seen = new Set<string>()
  const recentWorksheets = (recentAccess || []).filter((item: { worksheet_id: string }) => {
    if (seen.has(item.worksheet_id)) return false
    seen.add(item.worksheet_id)
    return true
  })

  // ── Computed stats ─────────────────────────────────────────────────────
  const totalClients = (activeClientCount ?? 0) + (dischargedClientCount ?? 0)
  const totalAssignments = (activeAssignmentCount ?? 0) + (completedAssignmentCount ?? 0)
  const completionRate = totalAssignments > 0
    ? Math.round(((completedAssignmentCount ?? 0) / totalAssignments) * 100)
    : 0

  const isFreeTier = profile.subscription_tier === 'free'
  const usesRemaining = isFreeTier
    ? Math.max(0, TIER_LIMITS.free.monthlyUses - (profile.monthly_download_count ?? 0))
    : null
  const usesUsed = isFreeTier ? TIER_LIMITS.free.monthlyUses - (usesRemaining ?? 0) : 0

  const tierLabels = TIER_LABELS

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // ── Onboarding checklist status ────────────────────────────────────────
  const checklistStatus = {
    browsedWorksheets: (recentAccess && recentAccess.length > 0) || false,
    addedClient: totalClients > 0,
    assignedHomework: totalAssignments > 0,
    exportedWorksheet: (userExportCount ?? 0) > 0,
  }

  // Activity feed helpers imported from @/lib/utils/activity

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Welcome modal + guided tour for first-time users */}
      <DashboardTour showWelcome={profile.onboarding_completed !== true} />

      {/* Auto-redeem promo code from signup */}
      <PromoAutoRedeem
        promoCode={(user.user_metadata?.promo_code as string) || null}
        isFree={profile.subscription_tier === 'free'}
      />

      {/* Annual upgrade nudge for monthly subscribers */}
      {profile.subscription_status === 'active' && activeSubscription && (
        <AnnualUpgradeBanner
          tier={profile.subscription_tier}
          stripePriceId={activeSubscription.stripe_price_id}
        />
      )}

      {/* Expired trial banner */}
      {(() => {
        if (!isFreeTier || !latestRedemption) return null
        const redemption = latestRedemption as { access_expires_at: string; promo_codes: { tier: string } | { tier: string }[] | null }
        if (new Date(redemption.access_expires_at) >= new Date()) return null
        const promoTier = Array.isArray(redemption.promo_codes) ? redemption.promo_codes[0]?.tier : redemption.promo_codes?.tier
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
                Upgrade from &pound;4.99/mo to keep your {promoTier ? tierLabels[promoTier] : 'premium'} features.
              </p>
            </div>
            <Link
              href="/pricing"
              className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
            >
              View plans
            </Link>
          </div>
        )
      })()}

      {/* Onboarding checklist for new users */}
      <OnboardingChecklist status={checklistStatus} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
          {greeting()}{profile.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="mt-1 text-primary-400">
          Here&apos;s an overview of your Formulate account
        </p>
      </div>

      {/* ── Analytics stat cards ─────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Clients */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{activeClientCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Active client{(activeClientCount ?? 0) !== 1 ? 's' : ''}
            {(dischargedClientCount ?? 0) > 0 && (
              <span className="text-primary-300"> · {dischargedClientCount} discharged</span>
            )}
            {(activeSuperviseeCount ?? 0) > 0 && (
              <span className="text-primary-300"> · {activeSuperviseeCount} supervisee{(activeSuperviseeCount ?? 0) !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        {/* Active Assignments */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{activeAssignmentCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">
            Active assignment{(activeAssignmentCount ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Pending Review */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${(pendingReviewCount ?? 0) > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
              {(pendingReviewCount ?? 0) > 0 ? (
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">{pendingReviewCount ?? 0}</p>
          <p className="mt-0.5 text-sm text-primary-400">
            {(pendingReviewCount ?? 0) > 0 ? 'Pending review' : 'All reviewed'}
          </p>
        </div>

        {/* Completion Rate */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary-900">
            {totalAssignments > 0 ? `${completionRate}%` : '—'}
          </p>
          <p className="mt-0.5 text-sm text-primary-400">
            {totalAssignments > 0
              ? `${completedAssignmentCount ?? 0} of ${totalAssignments} completed`
              : 'No assignments yet'
            }
          </p>
        </div>
      </div>

      {/* ── Second row: Plan card + Quick Actions + Activity ─────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Plan card */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">Your Plan</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              isFreeTier ? 'bg-primary-100 text-primary-500' : 'bg-brand/10 text-brand-dark'
            }`}>
              {tierLabels[profile.subscription_tier]}
            </span>
          </div>
          <div className="mt-4">
            {isFreeTier ? (
              <>
                <p className="text-3xl font-bold text-primary-900">
                  {usesRemaining}<span className="text-lg font-normal text-primary-300">/{TIER_LIMITS.free.monthlyUses}</span>
                </p>
                <p className="mt-1 text-sm text-primary-400">tools remaining this month</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-100">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${(usesUsed / TIER_LIMITS.free.monthlyUses) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-primary-900">Unlimited</p>
                <p className="mt-1 text-sm text-primary-400">worksheet access</p>
              </>
            )}
          </div>
          <div className="mt-4 border-t border-primary-50 pt-3">
            {isFreeTier ? (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
              >
                Upgrade plan
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : (
              <ManageSubscriptionButton />
            )}
          </div>
        </div>

        {/* Quick Actions card */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">Quick Actions</p>
          <div className="mt-4 space-y-1">
            <Link
              href="/worksheets"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              Browse worksheets
            </Link>
            <Link
              href="/clients"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              Manage clients
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              Profile settings
            </Link>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">Recent Activity</p>
          {(recentActivity && recentActivity.length > 0) ? (
            <div className="mt-4 space-y-3">
              {(recentActivity as ActivityItem[]).slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {activityIcon(item.action)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-primary-700">{activityLabel(item)}</p>
                    <p className="text-xs text-primary-400">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                <svg className="h-5 w-5 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-primary-400">No activity yet</p>
              <p className="text-xs text-primary-300">Your actions will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Contributor sections ───────────────────────────────────────── */}
      {(() => {
        const cRoles = profile.contributor_roles as { clinical_contributor?: boolean; clinical_reviewer?: boolean; content_writer?: boolean } | null
        if (!cRoles?.clinical_contributor && !cRoles?.clinical_reviewer && !cRoles?.content_writer) return null

        const statusBadge = (status: string) => {
          const styles: Record<string, string> = {
            draft: 'bg-primary-100 text-primary-600',
            submitted: 'bg-blue-50 text-blue-700',
            in_review: 'bg-amber-50 text-amber-700',
            changes_requested: 'bg-orange-50 text-orange-700',
            approved: 'bg-green-50 text-green-700',
            published: 'bg-green-100 text-green-800 font-semibold',
            rejected: 'bg-red-50 text-red-600',
          }
          const labels: Record<string, string> = {
            draft: 'Draft',
            submitted: 'Submitted',
            in_review: 'In Review',
            changes_requested: 'Changes Requested',
            approved: 'Approved',
            published: 'Published',
            rejected: 'Rejected',
          }
          return (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || styles.draft}`}>
              {labels[status] || status}
            </span>
          )
        }

        type Submission = { id: string; title: string; slug: string; library_status: string; submitted_at: string; admin_feedback: string | null }
        const submissions = (contributorSubmissions || []) as Submission[]

        return (
          <div className="space-y-4">
            {cRoles.clinical_contributor && (
              <div className="rounded-2xl border border-green-200 bg-surface p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-primary-900">Library Contributions</h3>
                      <p className="text-xs text-primary-400">Worksheets you&apos;ve submitted to the public library</p>
                    </div>
                  </div>
                  <Link
                    href="/my-tools/new"
                    className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    + New worksheet
                  </Link>
                </div>

                {submissions.length > 0 ? (
                  <div className="space-y-2">
                    {submissions.map((sub) => (
                      <div key={sub.id}>
                        <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-primary-900">{sub.title}</p>
                              {statusBadge(sub.library_status)}
                            </div>
                            {sub.submitted_at && (
                              <p className="mt-0.5 text-xs text-primary-400">
                                Submitted {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            {sub.library_status === 'published' && (
                              <Link
                                href={`/worksheets/${sub.slug}`}
                                className="text-xs font-medium text-green-600 hover:text-green-700"
                              >
                                View live &rarr;
                              </Link>
                            )}
                            {(sub.library_status === 'changes_requested' || sub.library_status === 'draft' || sub.library_status === 'rejected') && (
                              <Link
                                href={`/my-tools/${sub.id}/edit`}
                                className="text-xs font-medium text-brand hover:text-brand-dark"
                              >
                                Edit &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                        {sub.library_status === 'changes_requested' && sub.admin_feedback && (
                          <div className="mt-1 ml-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                            <p className="text-xs font-medium text-orange-600">Feedback:</p>
                            <p className="text-xs text-orange-800">{sub.admin_feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-primary-50 px-4 py-6 text-center">
                    <p className="text-sm text-primary-500">No submissions yet</p>
                    <p className="mt-1 text-xs text-primary-400">
                      Create a worksheet in <Link href="/my-tools/new" className="text-brand hover:text-brand-dark font-medium">My Tools</Link> and submit it to the library.
                    </p>
                  </div>
                )}
              </div>
            )}
            {cRoles.clinical_reviewer && (
              <div className="rounded-2xl border border-blue-200 bg-surface p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary-900">Review Queue</h3>
                    <p className="text-xs text-primary-400">Worksheets assigned to you for clinical review</p>
                  </div>
                </div>

                {(() => {
                  type ReviewItem = { id: string; worksheet_id: string; assigned_at: string; completed_at: string | null; worksheets: { title: string } | null }
                  const typedReviews = (reviewQueue || []) as unknown as ReviewItem[]

                  if (typedReviews.length > 0) {
                    return (
                      <div className="space-y-2">
                        {typedReviews.map((review) => (
                          <Link
                            key={review.id}
                            href={`/reviews/${review.worksheet_id}`}
                            className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 hover:bg-primary-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-primary-900">
                                {review.worksheets?.title || 'Untitled worksheet'}
                              </p>
                              <p className="mt-0.5 text-xs text-primary-400">
                                Assigned {new Date(review.assigned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <span className={`ml-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              review.completed_at ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {review.completed_at ? 'Completed' : 'Pending'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )
                  }

                  return (
                    <div className="rounded-xl bg-primary-50 px-4 py-6 text-center">
                      <p className="text-sm text-primary-500">No reviews assigned yet</p>
                      <p className="mt-1 text-xs text-primary-400">You&apos;ll see assigned worksheets here when an admin assigns one to you.</p>
                    </div>
                  )
                })()}
              </div>
            )}
            {cRoles.content_writer && (
              <div className="rounded-2xl border border-purple-200 bg-surface p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary-900">Content Queue</h3>
                    <p className="text-xs text-primary-400">Write clinical context for worksheets</p>
                  </div>
                </div>

                {(() => {
                  type ContentItem = { id: string; title: string; slug: string; clinical_context_status: string; clinical_context_feedback: string | null }
                  type AvailableItem = { id: string; title: string; slug: string }
                  const myItems = (myContentItems || []) as unknown as ContentItem[]
                  const available = (availableContent || []) as unknown as AvailableItem[]

                  const CONTENT_STATUS_BADGES: Record<string, { label: string; className: string }> = {
                    claimed: { label: 'Claimed', className: 'bg-purple-50 text-purple-700' },
                    submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700' },
                    approved: { label: 'Approved', className: 'bg-green-50 text-green-700' },
                    rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
                  }

                  return (
                    <div className="space-y-4">
                      {/* My content items */}
                      {myItems.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-primary-500">Your Content</p>
                          <div className="space-y-2">
                            {myItems.map((item) => {
                              const badge = CONTENT_STATUS_BADGES[item.clinical_context_status] || CONTENT_STATUS_BADGES.claimed
                              const isEditable = ['claimed', 'rejected'].includes(item.clinical_context_status)
                              const isApproved = item.clinical_context_status === 'approved'

                              return (
                                <div key={item.id}>
                                  <Link
                                    href={isApproved ? `/worksheets/${item.slug}` : `/content/${item.id}`}
                                    className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 hover:bg-primary-100 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate text-sm font-medium text-primary-900">{item.title}</p>
                                      {isEditable && <p className="mt-0.5 text-xs text-primary-400">Click to {item.clinical_context_status === 'rejected' ? 'revise' : 'write'} clinical context</p>}
                                    </div>
                                    <span className={`ml-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                                      {badge.label}
                                    </span>
                                  </Link>
                                  {item.clinical_context_status === 'rejected' && item.clinical_context_feedback && (
                                    <div className="mt-1 ml-4 rounded-lg bg-orange-50 px-3 py-2">
                                      <p className="text-xs text-orange-800">{item.clinical_context_feedback}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Available worksheets */}
                      {available.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-primary-500">Available Worksheets</p>
                          <div className="space-y-2">
                            {available.map((item) => (
                              <Link
                                key={item.id}
                                href={`/content/${item.id}`}
                                className="flex items-center justify-between rounded-xl bg-purple-50/50 px-4 py-3 hover:bg-purple-100/50 transition-colors"
                              >
                                <p className="truncate text-sm font-medium text-primary-900">{item.title}</p>
                                <span className="ml-3 text-xs font-medium text-purple-600">Needs context</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {myItems.length === 0 && available.length === 0 && (
                        <div className="rounded-xl bg-primary-50 px-4 py-6 text-center">
                          <p className="text-sm text-primary-500">No worksheets need clinical context right now</p>
                          <p className="mt-1 text-xs text-primary-400">Check back later — new worksheets are added regularly.</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Recently accessed worksheets ─────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900">
            Recently Used
          </h2>
          {recentWorksheets.length > 0 && (
            <Link
              href="/worksheets"
              className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        {recentWorksheets.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentWorksheets.map((item: { worksheet_id: string; created_at: string; worksheets: { title: string; slug: string } | { title: string; slug: string }[] | null }) => {
              const ws = Array.isArray(item.worksheets) ? item.worksheets[0] : item.worksheets
              return (
                <Link
                  key={item.worksheet_id}
                  href={`/worksheets/${ws?.slug || ''}`}
                  className="group rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-primary-800 group-hover:text-white dark:group-hover:bg-primary-200 dark:group-hover:text-primary-900">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-primary-300">
                      {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-primary-800 group-hover:text-primary-900">
                    {ws?.title || 'Untitled worksheet'}
                  </p>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary-200 bg-surface p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-primary-500">No worksheets used yet</p>
            <p className="mt-1 text-xs text-primary-400">Browse the library to get started</p>
            <Link
              href="/worksheets"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
            >
              Browse worksheets
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
