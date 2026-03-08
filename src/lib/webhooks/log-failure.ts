import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { WebhookProvider } from '@/types/database'

interface LogWebhookFailureParams {
  provider: WebhookProvider
  eventId?: string | null
  eventType?: string | null
  payload: unknown
  error: unknown
}

/**
 * Fields that may contain PII — stripped from webhook payloads before
 * storage. We keep only structural/error-relevant metadata.
 */
const PII_FIELDS = new Set([
  'email',
  'name',
  'full_name',
  'customer_email',
  'billing_details',
  'customer_name',
  'customer_address',
  'address',
  'phone',
  'receipt_email',
  'shipping',
  'to',
  'from',
  'subject',
  'cc',
  'bcc',
  'reply_to',
])

/**
 * Recursively strip PII fields from an object, replacing values with
 * "[REDACTED]". Preserves structure so admins can still diagnose issues.
 */
function sanitisePayload(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[TRUNCATED]'

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitisePayload(item, depth + 1))
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (PII_FIELDS.has(key.toLowerCase())) {
        result[key] = '[REDACTED]'
      } else {
        result[key] = sanitisePayload(value, depth + 1)
      }
    }
    return result
  }

  return obj
}

/**
 * Persist a webhook processing failure to the `webhook_failures` table.
 *
 * This creates a dead-letter record that admins can inspect and retry
 * from the admin dashboard. The function is fire-and-forget — it never
 * throws, so it won't interfere with the webhook response.
 *
 * PII fields (emails, names, addresses) are redacted before storage
 * to comply with data minimisation requirements (GDPR Art. 5(1)(c)).
 */
export async function logWebhookFailure({
  provider,
  eventId,
  eventType,
  payload,
  error,
}: LogWebhookFailureParams): Promise<void> {
  try {
    const supabase = createAdminClient()

    const errorMessage =
      error instanceof Error ? error.message : String(error)
    const errorStack =
      error instanceof Error ? error.stack ?? null : null

    // Parse if string, then sanitise PII
    const rawPayload =
      typeof payload === 'string'
        ? JSON.parse(payload)
        : (payload as Record<string, unknown>)

    const safePayload = sanitisePayload(rawPayload) as Record<string, unknown>

    await supabase.from('webhook_failures').insert({
      provider,
      event_id: eventId ?? null,
      event_type: eventType ?? null,
      payload: safePayload,
      error_message: errorMessage,
      error_stack: errorStack,
    })
  } catch (insertError) {
    // Last resort — if we can't even log the failure, just warn to Sentry
    logger.warn('[webhook-failure] Failed to persist webhook failure', {
      provider,
      eventId,
      originalError: String(error),
      insertError: String(insertError),
    })
  }
}
