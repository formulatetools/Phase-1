import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPin } from '@/lib/utils/pin-hash'
import { setSessionCookie } from '@/lib/utils/portal-session'
import { checkPinRateLimit, recordPinAttempt } from '@/lib/utils/pin-rate-limit'

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

    // Verify PIN
    const isValid = verifyPin(pin, relationship.portal_pin_salt, relationship.portal_pin_hash)

    // Record attempt
    await recordPinAttempt(relationship.id, ip, isValid)

    if (!isValid) {
      const remaining = Math.max(0, (rateLimit.remaining ?? 1) - 1)
      return NextResponse.json(
        { error: 'Incorrect PIN', attemptsRemaining: remaining },
        { status: 401 }
      )
    }

    // Success — set session cookie
    await setSessionCookie(relationship.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PIN verify API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
