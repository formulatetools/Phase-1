import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { WorksheetDetail } from '@/components/worksheets/worksheet-detail'
import type { ContributorProfile } from '@/types/database'

// ── Dynamic SEO metadata per worksheet ───────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('title, description, tags, categories(name)')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single()

  if (!worksheet) return { title: 'Worksheet Not Found' }

  const title = worksheet.title
  const description =
    worksheet.description?.slice(0, 160) ||
    `${worksheet.title} — a professional CBT worksheet for clinical use.`

  return {
    title,
    description,
    keywords: worksheet.tags || [],
    openGraph: {
      title: `${worksheet.title} — CBT Worksheet`,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${worksheet.title} — CBT Worksheet`,
      description,
    },
  }
}

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

  // Fetch contributor profile if this is a contributed worksheet
  let contributorName: string | null = null
  let contributorTitle: string | null = null
  let contributorUrl: string | null = null

  if (worksheet.submitted_by) {
    const { data: contributor } = await supabase
      .from('profiles')
      .select('full_name, contributor_profile')
      .eq('id', worksheet.submitted_by as string)
      .single()

    if (contributor) {
      const cp = (contributor as { full_name: string | null; contributor_profile: ContributorProfile | null }).contributor_profile
      contributorName = cp?.display_name || (contributor as { full_name: string | null }).full_name || null
      contributorTitle = cp?.professional_title || null
      contributorUrl = cp?.profile_url || null
    }
  }

  // Fetch content writer profile if clinical context is approved
  let contentWriterName: string | null = null
  let contentWriterTitle: string | null = null
  let contentWriterUrl: string | null = null

  if (worksheet.clinical_context_author && worksheet.clinical_context_status === 'approved') {
    const { data: contentWriter } = await supabase
      .from('profiles')
      .select('full_name, contributor_profile')
      .eq('id', worksheet.clinical_context_author as string)
      .single()

    if (contentWriter) {
      const cp = (contentWriter as { full_name: string | null; contributor_profile: ContributorProfile | null }).contributor_profile
      contentWriterName = cp?.display_name || (contentWriter as { full_name: string | null }).full_name || null
      contentWriterTitle = cp?.professional_title || null
      contentWriterUrl = cp?.profile_url || null
    }
  }

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

  // ── Structured data (JSON-LD) ─────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: worksheet.title,
    description: worksheet.description,
    applicationCategory: 'HealthApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    ...(category
      ? {
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Worksheets', item: 'https://formulatetools.co.uk/worksheets' },
              { '@type': 'ListItem', position: 2, name: category.name, item: `https://formulatetools.co.uk/worksheets/category/${category.slug}` },
              { '@type': 'ListItem', position: 3, name: worksheet.title },
            ],
          },
        }
      : {}),
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

          {/* Contributor attribution */}
          {contributorName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-primary-500">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>
                Contributed by{' '}
                {contributorUrl ? (
                  <a href={contributorUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:text-brand transition-colors">
                    {contributorName}
                  </a>
                ) : (
                  <span className="font-medium text-primary-700">{contributorName}</span>
                )}
                {contributorTitle && <span>, {contributorTitle}</span>}
              </span>
            </div>
          )}

          {/* Clinical context */}
          {worksheet.clinical_context && (
            <div className="mt-4 rounded-xl border border-green-200/50 bg-green-50/30 p-4">
              <h2 className="text-sm font-semibold text-green-800">Clinical Context</h2>
              <p className="mt-1 text-sm text-primary-600 leading-relaxed whitespace-pre-wrap">{worksheet.clinical_context}</p>
              {contentWriterName && (
                <div className="mt-3 flex items-center gap-2 text-sm text-primary-500">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span>
                    Clinical context by{' '}
                    {contentWriterUrl ? (
                      <a href={contentWriterUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:text-brand transition-colors">
                        {contentWriterName}
                      </a>
                    ) : (
                      <span className="font-medium text-primary-700">{contentWriterName}</span>
                    )}
                    {contentWriterTitle && <span>, {contentWriterTitle}</span>}
                  </span>
                </div>
              )}
            </div>
          )}

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
