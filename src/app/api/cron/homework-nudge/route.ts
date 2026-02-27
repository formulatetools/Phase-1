import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { homeworkNudgeEmail } from '@/lib/email-templates'

/**
 * Homework nudge cron — sends therapist a reminder when a client's
 * homework hasn't been completed 48+ hours after assignment.
 *
 * Schedule: daily at 09:00 UTC (via Vercel Cron or external scheduler)
 * Endpoint: GET /api/cron/homework-nudge
 *
 * Only sends ONE nudge per assignment (dedup via audit_log).
 * Only targets assignments that are still active (not expired, not deleted).
 */

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

  // Find assignments that are:
  // - still 'assigned' (never started) or 'in_progress' (started but not submitted)
  // - assigned more than 48 hours ago
  // - not expired, not deleted
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { data: candidates } = await supabase
    .from('worksheet_assignments')
    .select('id, therapist_id, relationship_id, worksheet_id, assigned_at')
    .in('status', ['assigned', 'in_progress'])
    .lt('assigned_at', fortyEightHoursAgo)
    .gt('expires_at', now)
    .is('deleted_at', null)

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: 0 })
  }

  // Batch dedup: check which assignments already got a nudge
  const assignmentIds = candidates.map(a => a.id)
  const { data: sentEmails } = await supabase
    .from('audit_log')
    .select('metadata')
    .eq('entity_type', 'email')
    .eq('entity_id', 'homework_nudge')
    .in('metadata->>assignment_id', assignmentIds)

  const sentAssignmentIds = new Set(
    (sentEmails ?? []).map(e => (e.metadata as Record<string, string>)?.assignment_id).filter(Boolean)
  )

  // Filter to un-nudged assignments
  const toNudge = candidates.filter(a => !sentAssignmentIds.has(a.id))
  if (toNudge.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: candidates.length })
  }

  // Batch fetch therapist profiles
  const therapistIds = [...new Set(toNudge.map(a => a.therapist_id))]
  const { data: therapists } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', therapistIds)

  const therapistMap = new Map((therapists ?? []).map(t => [t.id, t]))

  // Batch fetch relationships for client labels
  const relationshipIds = [...new Set(toNudge.map(a => a.relationship_id))]
  const { data: relationships } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label')
    .in('id', relationshipIds)

  const relMap = new Map((relationships ?? []).map(r => [r.id, r]))

  // Batch fetch worksheet titles
  const worksheetIds = [...new Set(toNudge.map(a => a.worksheet_id))]
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('id, title')
    .in('id', worksheetIds)

  const wsMap = new Map((worksheets ?? []).map(w => [w.id, w]))

  let sent = 0

  for (const assignment of toNudge) {
    const therapist = therapistMap.get(assignment.therapist_id)
    const relationship = relMap.get(assignment.relationship_id)
    const worksheet = wsMap.get(assignment.worksheet_id)

    if (!therapist || !relationship || !worksheet) continue

    const daysAgo = Math.floor(
      (Date.now() - new Date(assignment.assigned_at).getTime()) / 86_400_000
    )

    const clientDetailUrl = `${appUrl}/clients/${assignment.relationship_id}`

    const email = homeworkNudgeEmail(
      therapist.full_name as string | null,
      relationship.client_label as string,
      worksheet.title as string,
      clientDetailUrl,
      daysAgo
    )

    try {
      await sendEmail({
        to: therapist.email,
        subject: email.subject,
        html: email.html,
        emailType: 'homework_nudge',
      })
    } catch (emailError) {
      console.error(`Failed to send homework nudge for assignment ${assignment.id}:`, emailError)
      continue
    }

    // Log for dedup — one record per assignment so we never nudge twice
    await supabase.from('audit_log').insert({
      user_id: assignment.therapist_id,
      action: 'create',
      entity_type: 'email',
      entity_id: 'homework_nudge',
      metadata: {
        template: 'homework_nudge',
        assignment_id: assignment.id,
        worksheet_title: worksheet.title,
        client_label: relationship.client_label,
      },
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, candidates: candidates.length })
}
