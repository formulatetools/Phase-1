import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import {
  homeworkWeeklyDigestEmail,
  type DigestClient,
  type DigestItem,
} from '@/lib/email-templates'
import { verifyCronSecret } from '@/lib/utils/verify-cron-secret'

/**
 * Homework weekly digest — sends each therapist a single summary email
 * covering all clients' homework status for the past week.
 *
 * Schedule: Mondays at 09:00 UTC (via Vercel Cron)
 * Endpoint: GET /api/cron/homework-nudge
 *
 * Replaces the old daily per-assignment nudge system.
 * Instant completion notifications (notifyTherapist in /api/homework) are unchanged.
 *
 * Dedup: one email per therapist per week via audit_log entity_id = homework_digest_YYYY-MM-DD
 */

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const nowIso = now.toISOString()

  // Dedup key — one digest per week per therapist
  const weekKey = `homework_digest_${now.toISOString().slice(0, 10)}`

  // ── 1. Fetch all active assignments (not expired, not withdrawn, not deleted) ──
  const { data: assignments } = await supabase
    .from('worksheet_assignments')
    .select('id, therapist_id, relationship_id, worksheet_id, status, assigned_at, completed_at')
    .not('status', 'eq', 'withdrawn')
    .is('deleted_at', null)
    .gt('expires_at', nowIso)

  // Also fetch recently completed (this week, even if expired)
  const { data: recentlyCompleted } = await supabase
    .from('worksheet_assignments')
    .select('id, therapist_id, relationship_id, worksheet_id, status, assigned_at, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', oneWeekAgo)
    .is('deleted_at', null)

  // Merge, dedup by ID
  const allAssignments = new Map<string, typeof assignments extends (infer T)[] | null ? T : never>()
  for (const a of assignments ?? []) allAssignments.set(a.id, a)
  for (const a of recentlyCompleted ?? []) allAssignments.set(a.id, a)

  const assignmentList = [...allAssignments.values()]

  if (assignmentList.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no assignments' })
  }

  // ── 2. Group by therapist → relationship → assignments ──
  const therapistGroups = new Map<string, Map<string, typeof assignmentList>>()

  for (const a of assignmentList) {
    if (!therapistGroups.has(a.therapist_id)) {
      therapistGroups.set(a.therapist_id, new Map())
    }
    const relMap = therapistGroups.get(a.therapist_id)!
    if (!relMap.has(a.relationship_id)) {
      relMap.set(a.relationship_id, [])
    }
    relMap.get(a.relationship_id)!.push(a)
  }

  // ── 3. Batch dedup check ──
  const therapistIds = [...therapistGroups.keys()]
  const { data: alreadySent } = await supabase
    .from('audit_log')
    .select('user_id')
    .eq('entity_type', 'email')
    .eq('entity_id', weekKey)
    .in('user_id', therapistIds)

  const sentSet = new Set((alreadySent ?? []).map(e => e.user_id))

  // ── 4. Batch fetch therapists, relationships, worksheets ──
  const { data: therapists } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', therapistIds)
  const therapistMap = new Map((therapists ?? []).map(t => [t.id, t]))

  const allRelIds = [...new Set(assignmentList.map(a => a.relationship_id))]
  const { data: relationships } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label')
    .in('id', allRelIds)
  const relMap = new Map((relationships ?? []).map(r => [r.id, r]))

  const allWsIds = [...new Set(assignmentList.map(a => a.worksheet_id))]
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('id, title')
    .in('id', allWsIds)
  const wsMap = new Map((worksheets ?? []).map(w => [w.id, w]))

  // ── 5. Send digest emails ──
  let sent = 0
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (const [therapistId, clientMap] of therapistGroups) {
    if (sentSet.has(therapistId)) continue

    const therapist = therapistMap.get(therapistId)
    if (!therapist?.email) continue

    const clients: DigestClient[] = []
    let totalCompleted = 0
    let totalOutstanding = 0

    for (const [relId, relAssignments] of clientMap) {
      const rel = relMap.get(relId)
      if (!rel) continue

      const items: DigestItem[] = []

      for (const a of relAssignments) {
        const ws = wsMap.get(a.worksheet_id)
        const title = (ws?.title as string) ?? 'Untitled'

        if (a.status === 'completed' && a.completed_at) {
          const completedDay = dayNames[new Date(a.completed_at).getUTCDay()]
          items.push({ title, status: 'completed', detail: `Completed ${completedDay}` })
          totalCompleted++
        } else if (a.status === 'assigned' || a.status === 'in_progress') {
          const daysAgo = Math.floor(
            (now.getTime() - new Date(a.assigned_at).getTime()) / 86_400_000
          )
          const detail = daysAgo === 0
            ? 'Assigned today'
            : daysAgo === 1
              ? 'Assigned 1 day ago'
              : `Assigned ${daysAgo} days ago`
          items.push({ title, status: 'outstanding', detail })
          totalOutstanding++
        }
      }

      if (items.length === 0) continue

      // Sort: outstanding first, then completed
      items.sort((a, b) => {
        const order = { outstanding: 0, queued: 1, completed: 2 }
        return order[a.status] - order[b.status]
      })

      clients.push({
        clientLabel: rel.client_label as string,
        clientUrl: `${appUrl}/clients/${relId}`,
        items,
      })
    }

    if (clients.length === 0) continue

    // Sort clients alphabetically
    clients.sort((a, b) => a.clientLabel.localeCompare(b.clientLabel))

    const email = homeworkWeeklyDigestEmail(
      therapist.full_name as string | null,
      clients,
      totalCompleted,
      totalOutstanding
    )

    try {
      await sendEmail({
        to: therapist.email,
        subject: email.subject,
        html: email.html,
        emailType: 'homework_digest',
      })
    } catch (emailError) {
      console.error(`Failed to send homework digest for therapist ${therapistId}:`, emailError)
      continue
    }

    // Log for dedup
    await supabase.from('audit_log').insert({
      user_id: therapistId,
      action: 'create',
      entity_type: 'email',
      entity_id: weekKey,
      metadata: {
        template: 'homework_digest',
        clients: clients.length,
        completed: totalCompleted,
        outstanding: totalOutstanding,
      },
    })

    sent++
  }

  return NextResponse.json({
    ok: true,
    sent,
    therapists: therapistGroups.size,
    skippedDedup: sentSet.size,
  })
}
