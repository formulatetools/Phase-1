import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resend webhook handler — tracks email delivery events
 * (sent, delivered, opened, clicked, bounced, complained)
 *
 * Set up at: https://resend.com/webhooks
 * Endpoint: https://formulatetools.co.uk/api/webhooks/resend
 */

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

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ResendWebhookPayload

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
