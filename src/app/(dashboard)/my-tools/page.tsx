import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { SubscriptionTier } from '@/types/database'
import { MyToolsList } from '@/components/my-tools/my-tools-list'

export const metadata = {
  title: 'My Tools — Formulate',
}

export default async function MyToolsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier
  const limit = TIER_LIMITS[tier].maxCustomWorksheets

  // Fetch custom worksheets
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('id, title, description, tags, created_at, updated_at, forked_from, estimated_minutes')
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const customWorksheets = worksheets || []
  const count = customWorksheets.length
  const atLimit = limit !== Infinity && count >= limit

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">My Tools</h1>
          <p className="mt-1 text-primary-400">
            {limit === 0
              ? 'Create your own clinical worksheets'
              : limit === Infinity
                ? `${count} custom worksheet${count !== 1 ? 's' : ''}`
                : `${count} of ${limit} custom worksheets used`
            }
          </p>
        </div>
        {limit > 0 && (
          <Link
            href={atLimit ? '/pricing' : '/my-tools/new'}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              atLimit
                ? 'bg-primary-100 text-primary-500'
                : 'bg-primary-800 text-white hover:bg-primary-900'
            }`}
          >
            {atLimit ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Upgrade for more
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create new tool
              </>
            )}
          </Link>
        )}
      </div>

      {/* Free tier upgrade prompt */}
      {limit === 0 && (
        <div className="mb-8 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light to-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <svg className="h-7 w-7 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-primary-900">Build Your Own Clinical Tools</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-primary-500">
            Create custom worksheets tailored to your practice. Add sections, fields, tables, and
            computed calculations — then assign them to clients as homework.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-900"
          >
            Upgrade to Standard — from &pound;4.99/mo
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}

      {/* Worksheet list */}
      {limit > 0 && (
        <MyToolsList worksheets={customWorksheets as Array<{
          id: string
          title: string
          description: string
          tags: string[]
          created_at: string
          updated_at: string
          forked_from: string | null
          estimated_minutes: number | null
        }>} />
      )}
    </div>
  )
}
