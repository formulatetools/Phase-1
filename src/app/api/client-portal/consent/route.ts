import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hashIP } from '@/lib/utils/ip-hash'

// POST /api/client-portal/consent — record portal consent acceptance
// Uses service role to bypass RLS (anonymous portal flow)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { portalToken } = body

    if (!portalToken) {
      return NextResponse.json(
        { error: 'Missing portal token' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Look up relationship by portal token
    const { data: relationship, error: lookupError } = await supabase
      .from('therapeutic_relationships')
      .select('id, portal_consented_at')
      .eq('client_portal_token', portalToken)
      .is('deleted_at', null)
      .single()

    if (lookupError || !relationship) {
      return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
    }

    // Already consented — no-op
    if (relationship.portal_consented_at) {
      return NextResponse.json({ success: true, alreadyConsented: true })
    }

    // Hash the client IP — never store raw IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const ipHash = ip !== 'unknown' ? hashIP(ip) : null

    // Record portal consent
    const { error: updateError } = await supabase
      .from('therapeutic_relationships')
      .update({
        portal_consented_at: new Date().toISOString(),
        portal_consent_ip_hash: ipHash,
      })
      .eq('id', relationship.id)

    if (updateError) {
      console.error('Portal consent update error:', updateError)
      return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 })
    }

    // Log event (use existing event_type with scope metadata to distinguish from homework consent)
    await supabase.from('homework_events').insert({
      relationship_id: relationship.id,
      event_type: 'consent_granted',
      metadata: { scope: 'portal' },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Portal consent API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
