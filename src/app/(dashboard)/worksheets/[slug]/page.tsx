import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { WorksheetDetail } from '@/components/worksheets/worksheet-detail'

export default async function WorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  const { user, profile } = await getCurrentUser()

  // Determine access state
  let accessState: 'unauthenticated' | 'free_available' | 'free_limit_reached' | 'subscribed'

  if (!user || !profile) {
    accessState = 'unauthenticated'
  } else if (profile.subscription_tier !== 'free') {
    accessState = 'subscribed'
  } else {
    // Free tier — check usage
    let downloadCount = profile.monthly_download_count
    const resetAt = profile.download_count_reset_at

    // Check if counter needs reset
    if (resetAt && new Date(resetAt) <= new Date()) {
      downloadCount = 0
    }

    if (downloadCount >= TIER_LIMITS.free.monthlyUses) {
      accessState = 'free_limit_reached'
    } else {
      accessState = 'free_available'
    }
  }

  const category = worksheet.categories as { name: string; slug: string } | null

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2">
          {category && (
            <Link
              href={`/worksheets/category/${category.slug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {category.name}
            </Link>
          )}
        </div>

        {/* Worksheet metadata — always visible */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
            {worksheet.title}
          </h1>
          <p className="mt-2 text-primary-500">{worksheet.description}</p>

          {worksheet.instructions && (
            <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-4">
              <h2 className="text-sm font-semibold text-brand-dark">
                Instructions
              </h2>
              <p className="mt-1 text-sm text-primary-600">
                {worksheet.instructions}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-400">
            {worksheet.estimated_minutes && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~{worksheet.estimated_minutes} min
              </span>
            )}
            {worksheet.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {worksheet.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/worksheets?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-500 hover:bg-primary-100 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Worksheet content — gated by access state */}
        <WorksheetDetail
          worksheet={worksheet}
          accessState={accessState}
          usesRemaining={
            profile
              ? Math.max(0, TIER_LIMITS.free.monthlyUses - (profile.monthly_download_count ?? 0))
              : 0
          }
        />
      </div>
    </div>
  )
}
