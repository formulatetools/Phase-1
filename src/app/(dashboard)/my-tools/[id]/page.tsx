import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { MyToolPreviewActions } from '@/components/my-tools/my-tool-preview-actions'

export const metadata = { title: 'Custom Tool — Formulate' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MyToolDetailPage({ params }: PageProps) {
  const { id } = await params
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, title, description, instructions, schema, tags, estimated_minutes, category_id, created_at, updated_at, forked_from')
    .eq('id', id)
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  const typedWorksheet = worksheet as {
    id: string
    title: string
    description: string
    instructions: string
    schema: WorksheetSchema
    tags: string[]
    estimated_minutes: number | null
    category_id: string | null
    created_at: string
    updated_at: string
    forked_from: string | null
  }

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <div className="mb-2">
          <Link
            href="/my-tools"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            My Tools
          </Link>
        </div>

        {/* Title & metadata */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
                {typedWorksheet.title}
              </h1>
              <p className="mt-2 text-primary-500">{typedWorksheet.description}</p>
            </div>
            <MyToolPreviewActions worksheetId={typedWorksheet.id} />
          </div>

          {typedWorksheet.instructions && (
            <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-4">
              <h2 className="text-sm font-semibold text-brand-dark">Instructions</h2>
              <p className="mt-1 text-sm text-primary-600">{typedWorksheet.instructions}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-400">
            {typedWorksheet.forked_from && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Customised from library
              </span>
            )}
            {typedWorksheet.estimated_minutes && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~{typedWorksheet.estimated_minutes} min
              </span>
            )}
            {typedWorksheet.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {typedWorksheet.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span>
              Updated {new Date(typedWorksheet.updated_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Worksheet preview */}
        <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
          <WorksheetRenderer
            schema={typedWorksheet.schema}
            readOnly={false}
          />
        </div>
      </div>
    </div>
  )
}
