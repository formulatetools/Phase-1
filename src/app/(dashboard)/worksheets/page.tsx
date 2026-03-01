import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { WorksheetSearch } from '@/components/worksheets/worksheet-search'
import { getResourceType } from '@/lib/utils/resource-type'
import type { ResourceTypeFilter } from '@/lib/utils/resource-type'

export const metadata = {
  title: 'Resource Library — Formulate',
  description: 'Browse professional CBT resources and clinical tools by category.',
  alternates: {
    canonical: '/worksheets',
  },
}

export default async function WorksheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; type?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all published worksheets
  const { data: allWorksheets } = await supabase
    .from('worksheets')
    .select('id, title, slug, description, tags, estimated_minutes, category_id, is_premium, categories(name, slug)')
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('display_order')

  // Extract all unique tags for the filter chips
  const tagSet = new Set<string>()
  ;(allWorksheets || []).forEach((w: { tags?: string[] }) => {
    ;(w.tags || []).forEach((t: string) => tagSet.add(t))
  })
  const allTags = [...tagSet].sort()

  // Resource type counts
  const countByType = { worksheet: 0, formulation: 0, supervision: 0 }
  ;(allWorksheets || []).forEach((w: { tags?: string[] }) => {
    const t = getResourceType(w.tags)
    countByType[t]++
  })

  // Resource type filter
  const typeFilter = (params.type || 'all') as ResourceTypeFilter

  // Client-side-style filtering (we already fetched everything)
  let searchResults: typeof allWorksheets | null = null
  const hasSearchOrTag = params.q || params.tag
  const hasTypeFilter = typeFilter !== 'all'

  if (hasSearchOrTag || hasTypeFilter) {
    const q = params.q?.toLowerCase() || ''
    const tag = params.tag || ''

    searchResults = (allWorksheets || []).filter(
      (w: { title: string; description: string; tags?: string[] }) => {
        // Text/tag search filter
        const matchesQuery =
          !q ||
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          (w.tags || []).some((t: string) => t.toLowerCase().includes(q))
        const matchesTag =
          !tag || (w.tags || []).some((t: string) => t.toLowerCase() === tag.toLowerCase())
        // Resource type filter
        const matchesType = !hasTypeFilter || getResourceType(w.tags) === typeFilter
        return matchesQuery && matchesTag && matchesType
      }
    )

    // Track search for analytics (fire-and-forget)
    if (q) {
      const { user } = await getCurrentUser()
      if (user) {
        supabase.from('audit_log').insert({
          user_id: user.id,
          action: 'read',
          entity_type: 'search',
          entity_id: 'worksheet_search',
          metadata: { query: q, tag: tag || null, type: typeFilter, results_count: searchResults.length },
        }).then(() => {})
      }
    }
  }

  // Resource type card config
  const resourceTypeCards = [
    {
      type: 'worksheet' as const,
      label: 'Worksheets',
      description: 'Structured CBT worksheets for depression, anxiety, OCD, trauma, and more.',
      count: countByType.worksheet,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      colour: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    },
    {
      type: 'formulation' as const,
      label: 'Formulations',
      description: 'Interactive formulation diagrams — cross-sectional, longitudinal, and vicious flower models.',
      count: countByType.formulation,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
      colour: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    },
    {
      type: 'supervision' as const,
      label: 'Supervision Tools',
      description: 'Reflective practice logs, case formulation templates, and supervisee homework.',
      count: countByType.supervision,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
      colour: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    },
  ]

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
          Resource Library
        </h1>
        <p className="mt-1 text-primary-400">
          {allWorksheets?.length || 0} professional CBT resources
        </p>
      </div>

      <WorksheetSearch initialQuery={params.q} initialTag={params.tag} initialType={params.type} allTags={allTags} />

      {/* Search / filter results */}
      {searchResults ? (
        <div className="mt-8">
          {hasSearchOrTag && (
            <h2 className="mb-4 text-base font-semibold text-primary-800">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}{' '}
              {params.q && <>for &quot;{params.q}&quot;</>}
              {params.tag && <> tagged &quot;{params.tag}&quot;</>}
            </h2>
          )}
          {searchResults.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map(
                (worksheet: {
                  id: string
                  slug: string
                  title: string
                  description: string
                  tags?: string[]
                  estimated_minutes?: number
                  is_premium: boolean
                  categories: { name: string; slug: string } | { name: string; slug: string }[] | null
                }) => {
                  const cat = Array.isArray(worksheet.categories)
                    ? worksheet.categories[0]
                    : worksheet.categories
                  return (
                    <Link
                      key={worksheet.id}
                      href={`/worksheets/${worksheet.slug}`}
                      className="group rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-primary-900 group-hover:text-brand-dark">
                          {worksheet.title}
                        </h3>
                        {worksheet.is_premium && (
                          <span className="ml-2 shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-primary-500 line-clamp-2">
                        {worksheet.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        {cat && <span className="text-xs text-primary-400">{cat.name}</span>}
                        {worksheet.estimated_minutes && (
                          <span className="flex items-center gap-1 text-xs text-primary-400">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            ~{worksheet.estimated_minutes} min
                          </span>
                        )}
                      </div>
                      {worksheet.tags && worksheet.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {worksheet.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-500"
                            >
                              {tag}
                            </span>
                          ))}
                          {worksheet.tags.length > 3 && (
                            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-400">
                              +{worksheet.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                }
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary-200 bg-surface p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                <svg
                  className="h-6 w-6 text-primary-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-primary-500">No resources found</p>
              <p className="mt-1 text-xs text-primary-400">Try a different search term or filter</p>
            </div>
          )}
        </div>
      ) : (
        /* Resource type cards */
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {resourceTypeCards.map((card) => (
            <Link
              key={card.type}
              href={`/worksheets?type=${card.type}`}
              className="group rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${card.colour}`}>
                  {card.icon}
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-500">
                  {card.count} tool{card.count !== 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-primary-900 group-hover:text-brand-dark">
                {card.label}
              </h2>
              <p className="mt-1 text-sm text-primary-400 line-clamp-2">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
