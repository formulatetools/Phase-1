import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPin } from '@/lib/utils/pin-hash'
import { clearSessionCookie } from '@/lib/utils/portal-session'
import { checkPinRateLimit, recordPinAttempt } from '@/lib/utils/pin-rate-limit'

const PIN_REGEX = /^\d{4}$/

export async function POST(request: NextRequest) {
  try {
    const { portalToken, currentPin } = await request.json()

    if (!portalToken || !currentPin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!PIN_REGEX.test(currentPin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: relationship } = await supabase
      .from('therapeutic_relationships')
      .select('id, portal_pin_hash, portal_pin_salt')
      .eq('client_portal_token', portalToken)
      .is('deleted_at', null)
      .single()

    if (!relationship) {
      return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
    }

    if (!relationship.portal_pin_hash || !relationship.portal_pin_salt) {
      return NextResponse.json(
        { error: 'No PIN is set for this portal' },
        { status: 400 }
      )
    }

    // Rate limit check
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

    const rateLimit = await checkPinRateLimit(relationship.id, ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    // Verify current PIN
    const isValid = verifyPin(currentPin, relationship.portal_pin_salt, relationship.portal_pin_hash)

    await recordPinAttempt(relationship.id, ip, isValid)

    if (!isValid) {
      const remaining = Math.max(0, (rateLimit.remaining ?? 1) - 1)
      return NextResponse.json(
        { error: 'Incorrect PIN', attemptsRemaining: remaining },
        { status: 401 }
      )
    }

    // Clear PIN
    const { error: updateError } = await supabase
      .from('therapeutic_relationships')
      .update({
        portal_pin_hash: null,
        portal_pin_salt: null,
        portal_pin_set_at: null,
      })
      .eq('id', relationship.id)

    if (updateError) {
      console.error('PIN remove error:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove PIN' },
        { status: 500 }
      )
    }

    // Clear session cookie
    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PIN remove API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
