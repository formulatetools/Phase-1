import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { ReviewForm } from './review-form'
import type { ContributorRoles, WorksheetReview } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'

export const metadata = { title: 'Review Worksheet — Formulate' }

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ worksheetId: string }>
}) {
  const { worksheetId } = await params
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  // Verify user has clinical_reviewer role
  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_reviewer) redirect('/dashboard')

  const supabase = await createClient()

  // Fetch review + worksheet in parallel
  const [{ data: review }, { data: worksheet }] = await Promise.all([
    supabase
      .from('worksheet_reviews')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .eq('reviewer_id', user.id)
      .single(),
    supabase
      .from('worksheets')
      .select('id, title, description, instructions, schema, clinical_context, references_sources, category_id, tags, estimated_minutes')
      .eq('id', worksheetId)
      .is('deleted_at', null)
      .single(),
  ])

  if (!review) notFound()
  if (!worksheet) notFound()

  const typedReview = review as WorksheetReview

  type WorksheetData = {
    id: string; title: string; description: string; instructions: string
    schema: WorksheetSchema; clinical_context: string | null
    references_sources: string | null; category_id: string | null
    tags: string[]; estimated_minutes: number | null
  }

  const ws = worksheet as WorksheetData

  // Fetch category name
  let categoryName = 'Not specified'
  if (ws.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', ws.category_id)
      .single()
    if (category) categoryName = (category as { name: string }).name
  }

  const isCompleted = !!typedReview.completed_at

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Back link */}
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">{ws.title}</h1>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isCompleted ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {isCompleted ? 'Review Completed' : 'Pending Review'}
          </span>
        </div>
        <p className="text-primary-400">
          Assigned {new Date(typedReview.assigned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Worksheet metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-primary-900">Worksheet Info</h2>
            <div className="space-y-3">
              <div className="rounded-xl bg-primary-50 px-4 py-3">
                <p className="text-xs font-medium text-primary-500">Category</p>
                <p className="mt-0.5 text-sm text-primary-900">{categoryName}</p>
              </div>

              {ws.estimated_minutes && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Est. Duration</p>
                  <p className="mt-0.5 text-sm text-primary-900">{ws.estimated_minutes} minutes</p>
                </div>
              )}

              {ws.tags && ws.tags.length > 0 && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Tags</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ws.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full bg-primary-200/50 px-2 py-0.5 text-[10px] text-primary-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ws.clinical_context && (
                <div className="rounded-xl bg-green-50/50 border border-green-200/50 px-4 py-3">
                  <p className="text-xs font-medium text-green-700">Clinical Context</p>
                  <p className="mt-1 text-sm text-primary-700 whitespace-pre-wrap leading-relaxed">{ws.clinical_context}</p>
                </div>
              )}

              {ws.references_sources && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">References / Sources</p>
                  <p className="mt-1 text-sm text-primary-700 whitespace-pre-wrap">{ws.references_sources}</p>
                </div>
              )}
            </div>
          </div>

          {/* Blind review notice */}
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 px-4 py-3">
            <p className="text-xs text-blue-700">
              <strong>Blind review:</strong> Contributor identity is hidden to ensure unbiased evaluation.
            </p>
          </div>
        </div>

        {/* Right column: Worksheet preview + review form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Worksheet preview */}
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-primary-900">Worksheet Preview</h2>
            <p className="mb-5 text-sm text-primary-400">Review the worksheet content below</p>

            {ws.description && (
              <p className="mb-3 text-sm text-primary-600">{ws.description}</p>
            )}
            {ws.instructions && (
              <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                {ws.instructions}
              </div>
            )}

            <WorksheetRenderer
              schema={ws.schema}
              readOnly={true}
            />
          </div>

          {/* Review form */}
          <ReviewForm
            worksheetId={worksheetId}
            existingReview={typedReview}
            isCompleted={isCompleted}
          />
        </div>
      </div>
    </div>
  )
}
