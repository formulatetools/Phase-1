'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { contentApprovedEmail, contentFeedbackEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

type ActionResult = { success: boolean; error?: string }

// ── Approve Content ─────────────────────────────────────────────────

export async function approveContent(worksheetId: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, slug, clinical_context_status, clinical_context_author')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return { success: false, error: 'Worksheet not found' }

  const ws = worksheet as { id: string; title: string; slug: string; clinical_context_status: string; clinical_context_author: string }
  if (ws.clinical_context_status !== 'submitted') return { success: false, error: 'Worksheet is not in submitted state' }

  await admin
    .from('worksheets')
    .update({ clinical_context_status: 'approved', clinical_context_feedback: null })
    .eq('id', worksheetId)

  // Fetch writer for email
  const { data: writer } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ws.clinical_context_author)
    .single()

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'clinical_context',
    entity_id: worksheetId,
    metadata: { status: 'approved', title: ws.title },
  })

  if (writer) {
    const w = writer as { email: string; full_name: string | null }
    const worksheetUrl = `${APP_URL}/worksheets/${ws.slug}`
    const email = contentApprovedEmail(w.full_name, ws.title, worksheetUrl)
    try {
      await sendEmail({ to: w.email, subject: email.subject, html: email.html, emailType: 'content_approved' })
    } catch (emailError) {
      console.error('Failed to send content approved email:', emailError)
    }
  }

  revalidatePath('/admin/content')
  revalidatePath(`/worksheets/${ws.slug}`)
  revalidatePath('/dashboard')

  return { success: true }
}

// ── Reject Content ──────────────────────────────────────────────────

export async function rejectContent(worksheetId: string, feedback: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  if (!feedback.trim()) return { success: false, error: 'Feedback is required' }

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, slug, clinical_context_status, clinical_context_author')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return { success: false, error: 'Worksheet not found' }

  const ws = worksheet as { id: string; title: string; slug: string; clinical_context_status: string; clinical_context_author: string }
  if (ws.clinical_context_status !== 'submitted') return { success: false, error: 'Worksheet is not in submitted state' }

  await admin
    .from('worksheets')
    .update({ clinical_context_status: 'rejected', clinical_context_feedback: feedback.trim() })
    .eq('id', worksheetId)

  const { data: writer } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ws.clinical_context_author)
    .single()

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'clinical_context',
    entity_id: worksheetId,
    metadata: { status: 'rejected', title: ws.title, feedback: feedback.trim() },
  })

  if (writer) {
    const w = writer as { email: string; full_name: string | null }
    const email = contentFeedbackEmail(w.full_name, ws.title, feedback.trim())
    try {
      await sendEmail({ to: w.email, subject: email.subject, html: email.html, emailType: 'content_rejected' })
    } catch (emailError) {
      console.error('Failed to send content rejected email:', emailError)
    }
  }

  revalidatePath('/admin/content')
  revalidatePath('/dashboard')

  return { success: true }
}
