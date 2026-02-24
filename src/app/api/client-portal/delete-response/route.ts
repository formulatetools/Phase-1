import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email'
import { withdrawalNotificationEmail } from '@/lib/email-templates'

// POST /api/client-portal/delete-response — delete a single homework response
// Uses service role (anonymous client portal, no auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { portalToken, assignmentId } = body

    if (!portalToken || !assignmentId) {
      return NextResponse.json(
        { error: 'Missing portalToken or assignmentId' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // 1. Verify portal token → get relationship
    const { data: relationship, error: relError } = await supabase
      .from('therapeutic_relationships')
      .select('id, therapist_id, client_label')
      .eq('client_portal_token', portalToken)
      .is('deleted_at', null)
      .single()

    if (relError || !relationship) {
      return NextResponse.json({ error: 'Invalid portal token' }, { status: 404 })
    }

    // 2. Rate limit — max 10 deletion events per relationship per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentEvents } = await supabase
      .from('homework_events')
      .select('*', { count: 'exact', head: true })
      .eq('relationship_id', relationship.id)
      .eq('event_type', 'consent_withdrawn')
      .gte('created_at', oneHourAgo)

    if (recentEvents !== null && recentEvents >= 10) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // 3. Verify assignment belongs to this relationship
    const { data: assignment, error: assignError } = await supabase
      .from('worksheet_assignments')
      .select('id, worksheet_id, status')
      .eq('id', assignmentId)
      .eq('relationship_id', relationship.id)
      .is('deleted_at', null)
      .single()

    if (assignError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Can't withdraw an already-withdrawn assignment
    if (assignment.status === 'withdrawn') {
      return NextResponse.json({ error: 'Response already withdrawn' }, { status: 400 })
    }

    // 4. Hard-delete worksheet_responses for this assignment
    await supabase
      .from('worksheet_responses')
      .delete()
      .eq('assignment_id', assignmentId)

    // 5. Update assignment status to withdrawn
    await supabase
      .from('worksheet_assignments')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    // 6. Log event
    await supabase.from('homework_events').insert({
      relationship_id: relationship.id,
      assignment_id: assignmentId,
      event_type: 'consent_withdrawn',
      metadata: { scope: 'single', worksheet_id: assignment.worksheet_id },
    })

    // 7. Get worksheet title + therapist email for notification
    const { data: worksheet } = await supabase
      .from('worksheets')
      .select('title')
      .eq('id', assignment.worksheet_id)
      .single()

    const { data: therapist } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', relationship.therapist_id)
      .single()

    if (therapist?.email) {
      const email = withdrawalNotificationEmail(
        therapist.full_name,
        relationship.client_label,
        worksheet?.title
      )
      await sendEmail({
        to: therapist.email,
        subject: email.subject,
        html: email.html,
        emailType: 'withdrawal_notification',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Client portal delete-response error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
