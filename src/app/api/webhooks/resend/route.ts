import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resend webhook handler — tracks email delivery events
 * (sent, delivered, opened, clicked, bounced, complained)
 *
 * Set up at: https://resend.com/webhooks
 * Endpoint: https://formulatetools.co.uk/api/webhooks/resend
 *
 * Signature verification uses the Svix standard (HMAC-SHA256).
 * Set RESEND_WEBHOOK_SECRET in your environment to enable verification.
 */

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

// Map of Resend event types to our simplified event types
const EVENT_MAP: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delayed',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string[]
    subject?: string
    tags?: Record<string, string>
  }
}

/**
 * Verify the Svix webhook signature (HMAC-SHA256).
 * Resend signs payloads using Svix's v1 scheme:
 *   1. The secret is base64-encoded, prefixed with "whsec_"
 *   2. The signed content is "{msg_id}.{timestamp}.{body}"
 *   3. The signature header contains one or more "v1,<base64>" entries
 */
function verifySignature(body: string, headers: Headers): boolean {
  if (!WEBHOOK_SECRET) return true // Skip if no secret configured

  const msgId = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const sigHeader = headers.get('svix-signature')

  if (!msgId || !timestamp || !sigHeader) return false

  // Reject timestamps older than 5 minutes (replay protection)
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  // Decode the secret (strip "whsec_" prefix, base64 decode)
  const secretBytes = Buffer.from(
    WEBHOOK_SECRET.startsWith('whsec_') ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET,
    'base64'
  )

  const signedContent = `${msgId}.${timestamp}.${body}`
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  // The header may contain multiple signatures ("v1,sig1 v1,sig2")
  const signatures = sigHeader.split(' ')
  return signatures.some((sig) => {
    const [version, value] = sig.split(',')
    if (version !== 'v1' || !value) return false
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(value)
      )
    } catch {
      return false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    if (!verifySignature(body, request.headers)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body) as ResendWebhookPayload

    const eventType = EVENT_MAP[payload.type]
    if (!eventType) {
      // Unknown event type, acknowledge but ignore
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()
    const to = payload.data.to?.[0] || 'unknown'
    const emailType = payload.data.tags?.email_type || 'unknown'
    const messageId = payload.data.email_id || null

    await supabase.from('email_events').insert({
      message_id: messageId,
      email_to: to,
      email_type: emailType,
      event_type: eventType,
      metadata: {
        subject: payload.data.subject,
        resend_event: payload.type,
        timestamp: payload.created_at,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[resend-webhook] Error processing event:', error)
    // Always return 200 to prevent Resend from retrying
    return NextResponse.json({ received: true })
  }
}
