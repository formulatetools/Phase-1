import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generatePinSalt, hashPin } from '@/lib/utils/pin-hash'
import { setSessionCookie } from '@/lib/utils/portal-session'

const PIN_REGEX = /^\d{4}$/

export async function POST(request: NextRequest) {
  try {
    const { portalToken, pin } = await request.json()

    if (!portalToken || !pin) {
      return NextResponse.json(
        { error: 'Missing portalToken or pin' },
        { status: 400 }
      )
    }

    if (!PIN_REGEX.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Look up relationship
    const { data: relationship } = await supabase
      .from('therapeutic_relationships')
      .select('id, portal_consented_at, portal_pin_hash')
      .eq('client_portal_token', portalToken)
      .is('deleted_at', null)
      .single()

    if (!relationship) {
      return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
    }

    // Must have consented first
    if (!relationship.portal_consented_at) {
      return NextResponse.json(
        { error: 'Portal consent required before setting a PIN' },
        { status: 403 }
      )
    }

    // Cannot set if already set — use change endpoint
    if (relationship.portal_pin_hash) {
      return NextResponse.json(
        { error: 'PIN already set. Use change to update it.' },
        { status: 409 }
      )
    }

    // Generate salt and hash
    const salt = generatePinSalt()
    const hash = hashPin(pin, salt)

    const { error: updateError } = await supabase
      .from('therapeutic_relationships')
      .update({
        portal_pin_hash: hash,
        portal_pin_salt: salt,
        portal_pin_set_at: new Date().toISOString(),
      })
      .eq('id', relationship.id)

    if (updateError) {
      console.error('PIN set error:', updateError)
      return NextResponse.json(
        { error: 'Failed to set PIN' },
        { status: 500 }
      )
    }

    // Set session cookie so they're immediately verified
    await setSessionCookie(relationship.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PIN set API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
