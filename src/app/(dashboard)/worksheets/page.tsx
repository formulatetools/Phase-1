import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  // If searching, fetch matching worksheets
  let searchResults = null
  if (params.q || params.tag) {
    let query = supabase
      .from('worksheets')
      .select('*, categories(name, slug)')
      .eq('is_published', true)
      .is('deleted_at', null)

    if (params.q) {
      query = query.or(
        `title.ilike.%${params.q}%,description.ilike.%${params.q}%`
      )
    }

    if (params.tag) {
      query = query.contains('tags', [params.tag])
    }

    const { data } = await query.order('display_order')
    searchResults = data
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
          Browse professional CBT worksheets and clinical tools
        </p>
      </div>

      <WorksheetSearch initialQuery={params.q} initialTag={params.tag} />

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
              {searchResults.map((worksheet) => (
                <Link
                  key={worksheet.id}
                  href={`/worksheets/${worksheet.slug}`}
                  className="group rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                >
                  <h3 className="font-semibold text-primary-900 group-hover:text-brand-dark">
                    {worksheet.title}
                  </h3>
                  <p className="mt-1 text-sm text-primary-500 line-clamp-2">
                    {worksheet.description}
                  </p>
                  {worksheet.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {worksheet.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center">
              <p className="text-sm text-primary-500">No worksheets found. Try a different search term.</p>
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
              className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-2xl transition-colors group-hover:bg-brand/10">
                {categoryIcons[category.slug] || '📋'}
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
