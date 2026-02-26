import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { WorksheetSearch } from '@/components/worksheets/worksheet-search'

export const metadata = {
  title: 'Worksheet Library — Formulate',
  description: 'Browse professional CBT worksheets and clinical tools by category.',
}

export default async function WorksheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Parallel fetches: categories + all published worksheets
  const [{ data: categories }, { data: allWorksheets }] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase
      .from('worksheets')
      .select('id, title, slug, description, tags, estimated_minutes, category_id, is_premium, categories(name, slug)')
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('display_order'),
  ])

  // Extract all unique tags for the filter chips
  const tagSet = new Set<string>()
  ;(allWorksheets || []).forEach((w: { tags?: string[] }) => {
    ;(w.tags || []).forEach((t: string) => tagSet.add(t))
  })
  const allTags = [...tagSet].sort()

  // Worksheet counts per category
  const countByCategory: Record<string, number> = {}
  ;(allWorksheets || []).forEach((w: { category_id: string }) => {
    countByCategory[w.category_id] = (countByCategory[w.category_id] || 0) + 1
  })

  // Client-side-style filtering (we already fetched everything)
  let searchResults = null
  if (params.q || params.tag) {
    const q = params.q?.toLowerCase() || ''
    const tag = params.tag || ''

    searchResults = (allWorksheets || []).filter(
      (w: { title: string; description: string; tags?: string[] }) => {
        const matchesQuery =
          !q ||
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          (w.tags || []).some((t: string) => t.toLowerCase().includes(q))
        const matchesTag =
          !tag || (w.tags || []).some((t: string) => t.toLowerCase() === tag.toLowerCase())
        return matchesQuery && matchesTag
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
          metadata: { query: q, tag: tag || null, results_count: searchResults.length },
        }).then(() => {})
      }
    }
  }

  const categoryIcons: Record<string, string> = {
    depression: '🌧',
    'generalised-anxiety-gad': '😰',
    'obsessive-compulsive-disorder-ocd': '🔄',
    'social-anxiety': '👥',
    'health-anxiety': '🏥',
    'panic-disorder': '⚡',
    'ptsd-trauma': '🛡',
    'low-self-esteem': '💭',
    'general-cbt-skills': '🧠',
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
          Worksheet Library
        </h1>
        <p className="mt-1 text-primary-400">
          {allWorksheets?.length || 0} professional CBT worksheets across{' '}
          {categories?.length || 0} categories
        </p>
      </div>

      <WorksheetSearch initialQuery={params.q} initialTag={params.tag} allTags={allTags} />

      {/* Search results */}
      {searchResults ? (
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-primary-800">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}{' '}
            {params.q && <>for &quot;{params.q}&quot;</>}
            {params.tag && <> tagged &quot;{params.tag}&quot;</>}
          </h2>
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
              <p className="mt-3 text-sm font-medium text-primary-500">No worksheets found</p>
              <p className="mt-1 text-xs text-primary-400">Try a different search term or tag</p>
            </div>
          )}
        </div>
      ) : (
        /* Categories grid */
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => (
            <Link
              key={category.id}
              href={`/worksheets/category/${category.slug}`}
              className="group rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-2xl transition-colors group-hover:bg-brand/10">
                  {categoryIcons[category.slug] || '📋'}
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-500">
                  {countByCategory[category.id] || 0} tool
                  {(countByCategory[category.id] || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-primary-900 group-hover:text-brand-dark">
                {category.name}
              </h2>
              <p className="mt-1 text-sm text-primary-400 line-clamp-2">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
