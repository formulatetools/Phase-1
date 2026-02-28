import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Dynamic SEO metadata per category ────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.name} Resources`,
    description:
      category.description ||
      `Browse ${category.name} CBT resources and clinical tools.`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('*')
    .eq('category_id', category.id)
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('display_order')

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-2">
        <Link
          href="/worksheets"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All categories
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-primary-400">{category.description}</p>
        )}
      </div>

      {worksheets && worksheets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map((worksheet) => (
            <Link
              key={worksheet.id}
              href={`/worksheets/${worksheet.slug}`}
              className="group rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <h3 className="font-semibold text-primary-900 group-hover:text-brand-dark">
                {worksheet.title}
              </h3>
              <p className="mt-1 text-sm text-primary-500 line-clamp-2">
                {worksheet.description}
              </p>
              {worksheet.estimated_minutes && (
                <p className="mt-2 flex items-center gap-1 text-xs text-primary-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ~{worksheet.estimated_minutes} min
                </p>
              )}
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
        <div className="rounded-2xl border border-dashed border-primary-200 bg-surface p-10 text-center">
          <p className="text-sm text-primary-500">No resources in this category yet. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
