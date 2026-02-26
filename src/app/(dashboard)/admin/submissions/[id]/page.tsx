import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { SubmissionActions } from './submission-actions'
import type { ContributorProfile, ContributorRoles } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'

export const metadata = { title: 'Submission Detail — Admin — Formulate' }

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700' },
  in_review: { label: 'In Review', className: 'bg-amber-50 text-amber-700' },
  changes_requested: { label: 'Changes Requested', className: 'bg-orange-50 text-orange-700' },
  approved: { label: 'Approved', className: 'bg-green-50 text-green-700' },
  published: { label: 'Published', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
}

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch the worksheet
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, title, slug, description, instructions, schema, library_status, submitted_at, submitted_by, published_at, published_by, admin_feedback, clinical_context, suggested_category, references_sources, category_id, tags, estimated_minutes')
    .eq('id', id)
    .not('library_status', 'is', null)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  type WorksheetData = {
    id: string; title: string; slug: string; description: string; instructions: string
    schema: WorksheetSchema; library_status: string; submitted_at: string | null
    submitted_by: string | null; published_at: string | null; published_by: string | null
    admin_feedback: string | null; clinical_context: string | null
    suggested_category: string | null; references_sources: string | null
    category_id: string | null; tags: string[]; estimated_minutes: number | null
  }

  const ws = worksheet as WorksheetData

  // Fetch contributor profile
  let contributorName = 'Unknown'
  let contributorTitle = ''
  let contributorBio = ''
  let contributorUrl = ''
  let contributorEmail = ''

  if (ws.submitted_by) {
    const { data: contributor } = await supabase
      .from('profiles')
      .select('full_name, email, contributor_profile')
      .eq('id', ws.submitted_by)
      .single()

    if (contributor) {
      const c = contributor as { full_name: string | null; email: string; contributor_profile: ContributorProfile | null }
      contributorEmail = c.email
      const cp = c.contributor_profile
      contributorName = cp?.display_name || c.full_name || c.email
      contributorTitle = cp?.professional_title || ''
      contributorBio = cp?.bio || ''
      contributorUrl = cp?.profile_url || ''
    }
  }

  // Fetch category name
  let categoryName = ws.suggested_category || 'Not specified'
  if (ws.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', ws.category_id)
      .single()
    if (category) categoryName = (category as { name: string }).name
  }

  // Fetch reviews for this worksheet
  const { data: rawReviews } = await supabase
    .from('worksheet_reviews')
    .select('id, worksheet_id, reviewer_id, assigned_at, completed_at, clinical_accuracy, completeness, usability, recommendation')
    .eq('worksheet_id', id)
    .order('assigned_at', { ascending: true })

  type RawReview = {
    id: string; worksheet_id: string; reviewer_id: string; assigned_at: string
    completed_at: string | null; clinical_accuracy: string | null
    completeness: string | null; usability: string | null; recommendation: string | null
  }

  const typedReviews = (rawReviews || []) as RawReview[]

  // Fetch reviewer profiles
  const reviewerIds = typedReviews.map(r => r.reviewer_id)
  let reviewerProfileMap: Record<string, string> = {}

  if (reviewerIds.length > 0) {
    const { data: reviewerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, contributor_profile')
      .in('id', reviewerIds)

    reviewerProfileMap = Object.fromEntries(
      (reviewerProfiles || []).map((p: { id: string; full_name: string | null; email: string; contributor_profile: ContributorProfile | null }) => {
        const displayName = p.contributor_profile?.display_name || p.full_name || p.email
        return [p.id, displayName]
      })
    )
  }

  const reviews = typedReviews.map(r => ({
    id: r.id,
    reviewer_id: r.reviewer_id,
    reviewer_name: reviewerProfileMap[r.reviewer_id] || 'Unknown',
    assigned_at: r.assigned_at,
    completed_at: r.completed_at,
    clinical_accuracy: r.clinical_accuracy,
    completeness: r.completeness,
    usability: r.usability,
    recommendation: r.recommendation,
  }))

  // Fetch available reviewers (users with clinical_reviewer role, not already assigned)
  const { data: allReviewerProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, contributor_roles, contributor_profile')
    .not('contributor_roles', 'is', null)

  type ReviewerProfile = {
    id: string; full_name: string | null; email: string
    contributor_roles: ContributorRoles | null; contributor_profile: ContributorProfile | null
  }

  const availableReviewers = ((allReviewerProfiles || []) as ReviewerProfile[])
    .filter(p => p.contributor_roles?.clinical_reviewer && !reviewerIds.includes(p.id))
    .map(p => ({
      id: p.id,
      name: p.contributor_profile?.display_name || p.full_name || p.email,
    }))

  const badge = STATUS_BADGES[ws.library_status] || STATUS_BADGES.submitted

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Back link */}
      <div className="mb-2">
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Submissions
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">{ws.title}</h1>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-primary-400">
          Submitted by {contributorName}
          {contributorTitle && `, ${contributorTitle}`}
          {ws.submitted_at && ` on ${new Date(ws.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Submission info + actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Submission metadata */}
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-primary-900">Submission Details</h2>

            <div className="space-y-3">
              <div className="rounded-xl bg-primary-50 px-4 py-3">
                <p className="text-xs font-medium text-primary-500">Category</p>
                <p className="mt-0.5 text-sm text-primary-900">{categoryName}</p>
              </div>

              {ws.clinical_context && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Clinical Context</p>
                  <p className="mt-1 text-sm text-primary-700 whitespace-pre-wrap leading-relaxed">{ws.clinical_context}</p>
                </div>
              )}

              {ws.references_sources && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">References / Sources</p>
                  <p className="mt-1 text-sm text-primary-700 whitespace-pre-wrap">{ws.references_sources}</p>
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

              {ws.estimated_minutes && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium text-primary-500">Est. Duration</p>
                  <p className="mt-0.5 text-sm text-primary-900">{ws.estimated_minutes} minutes</p>
                </div>
              )}
            </div>
          </div>

          {/* Contributor profile */}
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-primary-900">Contributor</h2>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary-900">{contributorName}</p>
              {contributorTitle && <p className="text-xs text-primary-500">{contributorTitle}</p>}
              {contributorBio && <p className="mt-1 text-xs text-primary-600">{contributorBio}</p>}
              {contributorUrl && (
                <a href={contributorUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:text-brand-dark">
                  {contributorUrl}
                </a>
              )}
              <p className="text-xs text-primary-400">{contributorEmail}</p>
            </div>

            {/* Attribution preview */}
            <div className="mt-4 rounded-xl border border-dashed border-primary-200 px-4 py-3">
              <p className="text-xs font-medium text-primary-500 mb-1">Attribution Preview</p>
              <p className="text-sm text-primary-900">
                Contributed by <strong>{contributorName}</strong>{contributorTitle && `, ${contributorTitle}`}
              </p>
            </div>
          </div>

          {/* Admin feedback (if exists) */}
          {ws.admin_feedback && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-2">Current Feedback</p>
              <p className="text-sm text-orange-800">{ws.admin_feedback}</p>
            </div>
          )}

          {/* Assign reviewer + reviews + action buttons */}
          <SubmissionActions
            worksheetId={ws.id}
            libraryStatus={ws.library_status}
            worksheetSlug={ws.slug}
            reviews={reviews}
            availableReviewers={availableReviewers}
          />
        </div>

        {/* Right column: Worksheet preview */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-primary-900">Worksheet Preview</h2>
            <p className="mb-5 text-sm text-primary-400">This is how the worksheet will appear to therapists and clients</p>

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
        </div>
      </div>
    </div>
  )
}
