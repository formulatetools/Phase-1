import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { ContentForm } from './content-form'
import type { ContributorRoles, ContentStatus } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'

export const metadata = { title: 'Write Clinical Context — Formulate' }

export default async function ContentWritingPage({
  params,
}: {
  params: Promise<{ worksheetId: string }>
}) {
  const { worksheetId } = await params
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  // Verify content_writer role
  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.content_writer) redirect('/dashboard')

  const supabase = await createClient()

  // Fetch worksheet — no submitted_by (blind, same as reviews)
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, title, slug, description, instructions, schema, category_id, tags, estimated_minutes, clinical_context, clinical_context_author, clinical_context_status, clinical_context_feedback')
    .eq('id', worksheetId)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  type WorksheetData = {
    id: string; title: string; slug: string; description: string; instructions: string
    schema: WorksheetSchema; category_id: string | null; tags: string[]
    estimated_minutes: number | null; clinical_context: string | null
    clinical_context_author: string | null; clinical_context_status: ContentStatus | null
    clinical_context_feedback: string | null
  }

  const ws = worksheet as WorksheetData

  // Verify user is the clinical_context_author
  if (ws.clinical_context_author !== user.id) redirect('/dashboard')

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

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Back link */}
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">{ws.title}</h1>
          {ws.clinical_context_status && (
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              ws.clinical_context_status === 'claimed' ? 'bg-purple-50 text-purple-700' :
              ws.clinical_context_status === 'submitted' ? 'bg-blue-50 text-blue-700' :
              ws.clinical_context_status === 'approved' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-600'
            }`}>
              {ws.clinical_context_status === 'claimed' ? 'Claimed' :
               ws.clinical_context_status === 'submitted' ? 'Submitted' :
               ws.clinical_context_status === 'approved' ? 'Approved' :
               'Rejected'}
            </span>
          )}
        </div>
        <p className="text-primary-400">Write clinical context to help therapists understand when and how to use this worksheet</p>
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
            </div>
          </div>

          {/* Writing guidance */}
          <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/30 px-4 py-3">
            <p className="text-xs font-medium text-purple-700 mb-2">Writing Guidance</p>
            <ul className="text-xs text-purple-600 space-y-1.5 list-disc list-inside">
              <li>Write 2–3 paragraphs for qualified CBT therapists</li>
              <li>Cover: who is this for, when would you use it, what evidence supports it</li>
              <li>Use clinical language naturally</li>
              <li>Aim for 150–250 words</li>
            </ul>
          </div>
        </div>

        {/* Right column: Worksheet preview + content form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Worksheet preview */}
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-primary-900">Worksheet Preview</h2>
            <p className="mb-5 text-sm text-primary-400">Review the worksheet content to inform your clinical context</p>

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

          {/* Content form */}
          <ContentForm
            worksheetId={worksheetId}
            worksheetSlug={ws.slug}
            existingContent={ws.clinical_context || ''}
            status={ws.clinical_context_status}
            feedback={ws.clinical_context_feedback}
          />
        </div>
      </div>
    </div>
  )
}
