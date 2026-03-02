import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { SubscriptionTier, Worksheet, WorkspaceTemplate } from '@/types/database'
import { TemplateList } from '@/components/templates/template-list'

export const metadata = {
  title: 'Homework Plans — Formulate',
}

export default async function HomeworkPlansPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier
  const limit = TIER_LIMITS[tier].maxWorkspaceTemplates

  // Fetch templates and worksheets in parallel
  const [{ data: templates }, { data: worksheets }] = await Promise.all([
    supabase
      .from('workspace_templates')
      .select('*')
      .eq('therapist_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),

    supabase
      .from('worksheets')
      .select('*')
      .or(`and(is_published.eq.true,is_curated.eq.true),and(created_by.eq.${user.id},is_curated.eq.false)`)
      .is('deleted_at', null)
      .order('title'),
  ])

  const typedTemplates = (templates || []) as WorkspaceTemplate[]
  const typedWorksheets = (worksheets || []) as Worksheet[]
  // Don't count example plans toward the user's limit
  const customCount = typedTemplates.filter((t) => !t.is_example).length

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Homework Plans</h1>
          <p className="mt-1 text-primary-400">
            {limit === 0
              ? 'Pre-built bundles of worksheets and resources you can assign in one click'
              : limit === Infinity
                ? `${customCount} plan${customCount !== 1 ? 's' : ''}`
                : `${customCount} of ${limit} plan${customCount !== 1 ? 's' : ''} used`
            }
          </p>
        </div>
      </div>

      {/* Always show the plan list (free users can see their example plan) */}
      <TemplateList
        templates={typedTemplates}
        worksheets={typedWorksheets}
        limit={limit}
        count={customCount}
      />

      {/* Free tier upgrade prompt — shown below the list */}
      {limit === 0 && (
        <div className="mt-6 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light to-white dark:to-surface p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <svg className="h-7 w-7 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM2.25 16.875c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-2.25z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-primary-900">Create Your Own Homework Plans</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-primary-500">
            Build custom bundles of worksheets and resources tailored to your clients.
            Upgrade to create your own plans alongside the example above.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900"
          >
            Upgrade to Starter — from &pound;4.99/mo
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}
