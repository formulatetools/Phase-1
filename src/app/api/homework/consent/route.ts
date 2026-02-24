import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hashIP } from '@/lib/utils/ip-hash'

// POST /api/homework/consent — record consent acceptance or decline
// Uses service role to bypass RLS (anonymous homework flow)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action } = body

    if (!token || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing token or invalid action' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Look up assignment by token
    const { data: assignment, error: lookupError } = await supabase
      .from('worksheet_assignments')
      .select('id, relationship_id, worksheet_id')
      .eq('token', token)
      .is('deleted_at', null)
      .single()

    if (lookupError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (action === 'accept') {
      // Hash the client IP — never store raw IP
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
      const ipHash = ip !== 'unknown' ? hashIP(ip) : null

      const userAgent = request.headers.get('user-agent') || null

      // Insert consent record
      // The unique partial index will prevent duplicates (concurrent tabs)
      const { error: consentError } = await supabase
        .from('homework_consent')
        .insert({
          relationship_id: assignment.relationship_id,
          consent_type: 'homework_digital_completion',
          ip_hash: ipHash,
          user_agent: userAgent,
        })

      if (consentError) {
        // If unique violation, consent already exists — that's fine
        if (consentError.code === '23505') {
          return NextResponse.json({ success: true })
        }
        console.error('Consent insert error:', consentError)
        return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 })
      }

      // Log event
      await supabase.from('homework_events').insert({
        relationship_id: assignment.relationship_id,
        assignment_id: assignment.id,
        event_type: 'consent_granted',
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'decline') {
      // Do NOT record consent — client declined digital processing

      // Update assignment status to pdf_downloaded
      await supabase
        .from('worksheet_assignments')
        .update({
          status: 'pdf_downloaded',
          completion_method: 'paper',
          pdf_downloaded_at: new Date().toISOString(),
        })
        .eq('id', assignment.id)

      // Log the decline event
      await supabase.from('homework_events').insert({
        relationship_id: assignment.relationship_id,
        assignment_id: assignment.id,
        event_type: 'consent_declined',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Consent API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
