import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email'
import { withdrawalNotificationEmail } from '@/lib/email-templates'

// POST /api/client-portal/delete-all — delete ALL homework data for a client relationship
// Uses service role (anonymous client portal, no auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { portalToken, confirmText } = body

    if (!portalToken) {
      return NextResponse.json({ error: 'Missing portalToken' }, { status: 400 })
    }

    // Must type "DELETE" to confirm
    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm' },
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

    // 3. Count responses being deleted (for notification)
    const { count: deletedCount } = await supabase
      .from('worksheet_responses')
      .select('*', { count: 'exact', head: true })
      .eq('relationship_id', relationship.id)

    // 4. Hard-delete ALL worksheet_responses for this relationship
    await supabase
      .from('worksheet_responses')
      .delete()
      .eq('relationship_id', relationship.id)

    // 5. Set ALL assignments to withdrawn
    await supabase
      .from('worksheet_assignments')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
      .eq('relationship_id', relationship.id)
      .is('deleted_at', null)

    // 6. Expire all homework tokens (set expires_at to now)
    await supabase
      .from('worksheet_assignments')
      .update({ expires_at: new Date().toISOString() })
      .eq('relationship_id', relationship.id)

    // 7. Withdraw consent — set withdrawn_at on homework_consent
    await supabase
      .from('homework_consent')
      .update({ withdrawn_at: new Date().toISOString() })
      .eq('relationship_id', relationship.id)
      .is('withdrawn_at', null)

    // 8. Log event
    await supabase.from('homework_events').insert({
      relationship_id: relationship.id,
      assignment_id: null,
      event_type: 'consent_withdrawn',
      metadata: { scope: 'all', responses_deleted: deletedCount ?? 0 },
    })

    // 9. Email therapist
    const { data: therapist } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', relationship.therapist_id)
      .single()

    if (therapist?.email) {
      const email = withdrawalNotificationEmail(
        therapist.full_name,
        relationship.client_label,
        undefined,
        deletedCount ?? 0
      )
      await sendEmail({
        to: therapist.email,
        subject: email.subject,
        html: email.html,
        emailType: 'withdrawal_notification',
      })
    }

    return NextResponse.json({
      success: true,
      deleted: { responses: deletedCount ?? 0 },
    })
  } catch (err) {
    console.error('Client portal delete-all error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
