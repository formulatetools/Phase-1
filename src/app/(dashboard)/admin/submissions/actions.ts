'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { submissionStatusEmail, reviewAssignedEmail } from '@/lib/email-templates'
import type { ContributorRoles } from '@/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

// ── Approve Submission ────────────────────────────────────────────────

export async function approveSubmission(worksheetId: string): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Fetch worksheet + contributor info
  const { data: worksheet, error: fetchError } = await admin
    .from('worksheets')
    .select('id, title, slug, library_status, submitted_by')
    .eq('id', worksheetId)
    .single()

  if (fetchError || !worksheet) return

  const ws = worksheet as { id: string; title: string; slug: string; library_status: string; submitted_by: string }
  if (!['submitted', 'in_review'].includes(ws.library_status)) return

  // Update status
  await admin
    .from('worksheets')
    .update({ library_status: 'approved', admin_feedback: null })
    .eq('id', worksheetId)

  // Fetch contributor for email
  const { data: contributor } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ws.submitted_by)
    .single()

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'library_submission',
    entity_id: worksheetId,
    metadata: { status: 'approved', title: ws.title },
  })

  // Send email
  if (contributor) {
    const c = contributor as { email: string; full_name: string | null }
    const email = submissionStatusEmail(c.full_name, ws.title, 'approved')
    sendEmail({ to: c.email, subject: email.subject, html: email.html, emailType: 'submission_approved' })
  }

  revalidatePath(`/admin/submissions/${worksheetId}`)
  revalidatePath('/admin/submissions')
}

// ── Request Changes ───────────────────────────────────────────────────

export async function requestChanges(worksheetId: string, feedback: string): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  if (!feedback.trim()) return

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, slug, library_status, submitted_by')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; slug: string; library_status: string; submitted_by: string }
  if (!['submitted', 'in_review', 'approved'].includes(ws.library_status)) return

  await admin
    .from('worksheets')
    .update({ library_status: 'changes_requested', admin_feedback: feedback.trim() })
    .eq('id', worksheetId)

  const { data: contributor } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ws.submitted_by)
    .single()

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'library_submission',
    entity_id: worksheetId,
    metadata: { status: 'changes_requested', title: ws.title, feedback: feedback.trim() },
  })

  if (contributor) {
    const c = contributor as { email: string; full_name: string | null }
    const email = submissionStatusEmail(c.full_name, ws.title, 'changes_requested', feedback.trim())
    sendEmail({ to: c.email, subject: email.subject, html: email.html, emailType: 'submission_changes_requested' })
  }

  revalidatePath(`/admin/submissions/${worksheetId}`)
  revalidatePath('/admin/submissions')
}

// ── Reject Submission ─────────────────────────────────────────────────

export async function rejectSubmission(worksheetId: string, feedback: string): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  if (!feedback.trim()) return

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, slug, library_status, submitted_by')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; slug: string; library_status: string; submitted_by: string }

  await admin
    .from('worksheets')
    .update({ library_status: 'rejected', admin_feedback: feedback.trim() })
    .eq('id', worksheetId)

  const { data: contributor } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ws.submitted_by)
    .single()

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'library_submission',
    entity_id: worksheetId,
    metadata: { status: 'rejected', title: ws.title, feedback: feedback.trim() },
  })

  if (contributor) {
    const c = contributor as { email: string; full_name: string | null }
    const email = submissionStatusEmail(c.full_name, ws.title, 'rejected', feedback.trim())
    sendEmail({ to: c.email, subject: email.subject, html: email.html, emailType: 'submission_rejected' })
  }

  revalidatePath(`/admin/submissions/${worksheetId}`)
  revalidatePath('/admin/submissions')
}

// ── Publish Submission ────────────────────────────────────────────────

export async function publishSubmission(worksheetId: string): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, slug, library_status, submitted_by')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; slug: string; library_status: string; submitted_by: string }
  if (ws.library_status !== 'approved') return

  await admin
    .from('worksheets')
    .update({
      library_status: 'published',
      is_published: true,
      visibility: 'public',
      published_at: new Date().toISOString(),
      published_by: user.id,
    })
    .eq('id', worksheetId)

  const { data: contributor } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ws.submitted_by)
    .single()

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'library_submission',
    entity_id: worksheetId,
    metadata: { status: 'published', title: ws.title },
  })

  if (contributor) {
    const c = contributor as { email: string; full_name: string | null }
    const worksheetUrl = `${APP_URL}/worksheets/${ws.slug}`
    const email = submissionStatusEmail(c.full_name, ws.title, 'published', undefined, worksheetUrl)
    sendEmail({ to: c.email, subject: email.subject, html: email.html, emailType: 'submission_published' })
  }

  revalidatePath(`/admin/submissions/${worksheetId}`)
  revalidatePath('/admin/submissions')
  revalidatePath('/worksheets')
}

// ── Assign Reviewer ──────────────────────────────────────────────────

export async function assignReviewer(worksheetId: string, reviewerId: string): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Validate reviewer has clinical_reviewer role
  const { data: reviewer } = await admin
    .from('profiles')
    .select('id, email, full_name, contributor_roles')
    .eq('id', reviewerId)
    .single()

  if (!reviewer) return

  const r = reviewer as { id: string; email: string; full_name: string | null; contributor_roles: ContributorRoles | null }
  if (!r.contributor_roles?.clinical_reviewer) return

  // Fetch worksheet for title + status validation
  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, library_status')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; library_status: string }
  if (!['submitted', 'in_review'].includes(ws.library_status)) return

  // Insert review assignment (UNIQUE constraint prevents duplicates)
  const { error: insertError } = await admin
    .from('worksheet_reviews')
    .insert({ worksheet_id: worksheetId, reviewer_id: reviewerId })

  if (insertError) return // Likely duplicate

  // Move status to in_review if currently submitted
  if (ws.library_status === 'submitted') {
    await admin
      .from('worksheets')
      .update({ library_status: 'in_review' })
      .eq('id', worksheetId)
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'assign',
    entity_type: 'worksheet_review',
    entity_id: worksheetId,
    metadata: { reviewer_id: reviewerId, reviewer_name: r.full_name, title: ws.title },
  })

  // Send email
  const reviewUrl = `${APP_URL}/reviews/${worksheetId}`
  const email = reviewAssignedEmail(r.full_name, ws.title, reviewUrl)
  sendEmail({ to: r.email, subject: email.subject, html: email.html, emailType: 'review_assigned' })

  revalidatePath(`/admin/submissions/${worksheetId}`)
  revalidatePath('/admin/submissions')
}
