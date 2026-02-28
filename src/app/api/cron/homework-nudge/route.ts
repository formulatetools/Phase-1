import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { homeworkNudgeEmail, homeworkFollowUpEmail } from '@/lib/email-templates'

/**
 * Homework nudge cron — sends therapist reminders when a client's
 * homework hasn't been completed after assignment.
 *
 * Schedule: daily at 09:00 UTC (via Vercel Cron or external scheduler)
 * Endpoint: GET /api/cron/homework-nudge
 *
 * Two nudge tiers:
 *   1. 48-hour nudge  — gentle first reminder (dedup key: homework_nudge_48h)
 *   2. 7-day follow-up — firmer second reminder (dedup key: homework_nudge_7d)
 *
 * Each tier sends at most once per assignment (dedup via audit_log).
 * Only targets assignments that are still active (not expired, not deleted).
 *
 * Backwards compatible: legacy audit entries with entity_id 'homework_nudge'
 * are treated as 48h nudges already sent.
 */

// Nudge tier definitions
const NUDGE_TIERS = [
  { key: 'homework_nudge_48h', minHours: 48, emailType: 'homework_nudge' as const },
  { key: 'homework_nudge_7d', minHours: 168, emailType: 'homework_follow_up' as const },
] as const

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
  // - assigned more than 48 hours ago (earliest tier threshold)
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
    .is('locked_at', null)

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: 0 })
  }

  // Batch dedup: check which assignments already got nudges at each tier
  // Include legacy 'homework_nudge' key for backwards compatibility
  const assignmentIds = candidates.map(a => a.id)
  const allKeys = [...NUDGE_TIERS.map(t => t.key), 'homework_nudge']
  const { data: sentEmails } = await supabase
    .from('audit_log')
    .select('entity_id, metadata')
    .eq('entity_type', 'email')
    .in('entity_id', allKeys)
    .in('metadata->>assignment_id', assignmentIds)

  // Build a set of "assignmentId:tierKey" pairs already sent
  const sentPairs = new Set<string>()
  for (const entry of sentEmails ?? []) {
    const assignmentId = (entry.metadata as Record<string, string>)?.assignment_id
    if (!assignmentId) continue
    if (entry.entity_id === 'homework_nudge' || entry.entity_id === 'homework_nudge_48h') {
      // Legacy or current 48h key — mark 48h tier as sent
      sentPairs.add(`${assignmentId}:homework_nudge_48h`)
    } else {
      sentPairs.add(`${assignmentId}:${entry.entity_id}`)
    }
  }

  // Determine which (assignment, tier) pairs need sending
  const toSend: { assignment: typeof candidates[0]; tier: typeof NUDGE_TIERS[number] }[] = []

  for (const assignment of candidates) {
    const hoursAgo = (Date.now() - new Date(assignment.assigned_at).getTime()) / 3_600_000

    for (const tier of NUDGE_TIERS) {
      if (hoursAgo >= tier.minHours && !sentPairs.has(`${assignment.id}:${tier.key}`)) {
        toSend.push({ assignment, tier })
      }
    }
  }

  if (toSend.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: candidates.length })
  }

  // Batch fetch therapist profiles
  const therapistIds = [...new Set(toSend.map(s => s.assignment.therapist_id))]
  const { data: therapists } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', therapistIds)

  const therapistMap = new Map((therapists ?? []).map(t => [t.id, t]))

  // Batch fetch relationships for client labels
  const relationshipIds = [...new Set(toSend.map(s => s.assignment.relationship_id))]
  const { data: relationships } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label')
    .in('id', relationshipIds)

  const relMap = new Map((relationships ?? []).map(r => [r.id, r]))

  // Batch fetch worksheet titles
  const worksheetIds = [...new Set(toSend.map(s => s.assignment.worksheet_id))]
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('id, title')
    .in('id', worksheetIds)

  const wsMap = new Map((worksheets ?? []).map(w => [w.id, w]))

  let sent = 0

  for (const { assignment, tier } of toSend) {
    const therapist = therapistMap.get(assignment.therapist_id)
    const relationship = relMap.get(assignment.relationship_id)
    const worksheet = wsMap.get(assignment.worksheet_id)

    if (!therapist || !relationship || !worksheet) continue

    const daysAgo = Math.floor(
      (Date.now() - new Date(assignment.assigned_at).getTime()) / 86_400_000
    )

    const clientDetailUrl = `${appUrl}/clients/${assignment.relationship_id}`

    // Pick the appropriate email template based on tier
    const email = tier.emailType === 'homework_follow_up'
      ? homeworkFollowUpEmail(
          therapist.full_name as string | null,
          relationship.client_label as string,
          worksheet.title as string,
          clientDetailUrl,
          daysAgo
        )
      : homeworkNudgeEmail(
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
        emailType: tier.emailType,
      })
    } catch (emailError) {
      console.error(`Failed to send ${tier.key} for assignment ${assignment.id}:`, emailError)
      continue
    }

    // Log for dedup — one record per (assignment, tier)
    await supabase.from('audit_log').insert({
      user_id: assignment.therapist_id,
      action: 'create',
      entity_type: 'email',
      entity_id: tier.key,
      metadata: {
        template: tier.emailType,
        assignment_id: assignment.id,
        worksheet_title: worksheet.title,
        client_label: relationship.client_label,
      },
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, candidates: candidates.length })
}
