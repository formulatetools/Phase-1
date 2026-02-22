import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <Link
          href="/worksheets"
          className="text-sm text-accent-600 hover:text-accent-700"
        >
          &larr; All categories
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-primary-500">{category.description}</p>
        )}
      </div>

      {worksheets && worksheets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map((worksheet) => (
            <Link
              key={worksheet.id}
              href={`/worksheets/${worksheet.slug}`}
              className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-primary-900">
                {worksheet.title}
              </h3>
              <p className="mt-1 text-sm text-primary-500 line-clamp-2">
                {worksheet.description}
              </p>
              {worksheet.estimated_minutes && (
                <p className="mt-2 text-xs text-primary-400">
                  ~{worksheet.estimated_minutes} min
                </p>
              )}
              {worksheet.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {worksheet.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-600"
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
        <p className="text-primary-500">
          No worksheets in this category yet. Check back soon.
        </p>
      )}
    </main>
  )
}
