import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import {
  buildGeneratePrompt,
  buildGeneratePromptWithContext,
} from '@/lib/ai/generate-prompt'
import type { SubscriptionTier } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

// Hobby plan default is 10s — AI call needs more headroom
export const maxDuration = 60

// Monthly generation limits per tier (mirror the non-streaming endpoint)
const AI_GENERATION_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  standard: 10,
  professional: Infinity,
}

/**
 * Streaming AI worksheet generation endpoint.
 *
 * Returns a Server-Sent Events stream with progress updates as tokens
 * arrive from Claude, then the full parsed result at the end.
 *
 * SSE event format:
 *   data: {"type":"status","message":"..."}
 *   data: {"type":"progress","tokens":150,"estimated_total":2000}
 *   data: {"type":"complete","data":{...full result...}}
 *   data: {"type":"error","message":"..."}
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  function sendEvent(data: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  }

  // ── 1. Auth ──────────────────────────────────────────────────────
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Tier gate ─────────────────────────────────────────────────
  const tier = profile.subscription_tier as SubscriptionTier
  const genLimit = AI_GENERATION_LIMITS[tier] ?? 0

  if (genLimit === 0) {
    return new Response(
      JSON.stringify({ error: 'AI worksheet generation is not available on your plan.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Check custom worksheet count limit
  const wsLimit = TIER_LIMITS[tier].maxCustomWorksheets
  if (wsLimit > 0 && wsLimit !== Infinity) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('worksheets')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('is_curated', false)
      .is('deleted_at', null)

    if (count !== null && count >= wsLimit) {
      return new Response(
        JSON.stringify({ error: `You've reached your plan's limit of ${wsLimit} custom worksheets.` }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── 3. Check monthly generation count ────────────────────────────
  if (genLimit !== Infinity) {
    const supabase = await createClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: genCount } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action', 'create')
      .eq('entity_type', 'ai_generation')
      .gte('created_at', startOfMonth.toISOString())

    if (genCount !== null && genCount >= genLimit) {
      return new Response(
        JSON.stringify({
          error: `You've used all ${genLimit} AI generations this month. Resets on the 1st.`,
          remaining: 0,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── 4. Parse request body ────────────────────────────────────────
  let body: { description?: string; clientContext?: { presentation?: string; stage?: string; previousWorksheets?: string[] } }
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const description = typeof body.description === 'string' ? body.description.trim() : ''

  if (!description) {
    return new Response(
      JSON.stringify({ error: 'Please describe the worksheet you want to create.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (description.length > 500) {
    return new Response(
      JSON.stringify({ error: 'Description is too long. Keep it under 500 characters.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── 5. Build prompt ──────────────────────────────────────────────
  const context = body.clientContext
  const prompt =
    context && (context.presentation || context.stage || context.previousWorksheets?.length)
      ? buildGeneratePromptWithContext(description, context)
      : buildGeneratePrompt(description)

  // ── 6. API key check ─────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    logger.error('ANTHROPIC_API_KEY not configured')
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Please contact support.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── 7. Stream response ───────────────────────────────────────────
  // Capture userId for use inside the stream closure
  const userId = user.id
  const estimatedTotal = 2000 // Rough estimate for progress calculation

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropic = new Anthropic({ apiKey })

        // Send initial status
        controller.enqueue(
          sendEvent({ type: 'status', message: 'Building worksheet...' })
        )

        let accumulatedText = ''
        let tokenCount = 0

        // Use streaming API
        const messageStream = anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 8192,
          messages: [{ role: 'user', content: prompt }],
        })

        messageStream.on('text', (text) => {
          accumulatedText += text
          tokenCount += text.length // Approximate token count by chars

          // Send progress every ~200 chars to avoid overwhelming the client
          if (tokenCount % 200 < text.length) {
            controller.enqueue(
              sendEvent({
                type: 'progress',
                tokens: Math.round(tokenCount / 4), // rough char-to-token ratio
                estimated_total: estimatedTotal,
              })
            )
          }
        })

        // Wait for message completion
        const finalMessage = await messageStream.finalMessage()

        // ── 8. Parse AI response ─────────────────────────────────────
        const responseText =
          finalMessage.content[0].type === 'text'
            ? finalMessage.content[0].text
            : accumulatedText

        // Strip accidental markdown fences
        const cleanedJson = responseText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/, '')
          .trim()

        let parsed: {
          meta?: {
            title?: string
            slug?: string
            description?: string
            instructions?: string
            tags?: string[]
            estimated_minutes?: number | null
            confidence?: string
            interpretation?: string
          }
          schema?: WorksheetSchema
        }

        try {
          parsed = JSON.parse(cleanedJson)
        } catch {
          logger.warn('AI returned invalid JSON (stream)', {
            preview: cleanedJson.slice(0, 300),
          })
          controller.enqueue(
            sendEvent({
              type: 'error',
              message:
                'Could not generate a worksheet from that description. Try being more specific.',
            })
          )
          controller.close()
          return
        }

        // ── 9. Validate schema ───────────────────────────────────────
        if (!parsed.schema || !parsed.schema.sections) {
          controller.enqueue(
            sendEvent({
              type: 'error',
              message: 'Could not generate a valid worksheet. Try rephrasing your description.',
            })
          )
          controller.close()
          return
        }

        for (const section of parsed.schema.sections) {
          if (!section.id || !Array.isArray(section.fields)) {
            controller.enqueue(
              sendEvent({
                type: 'error',
                message: 'Generated schema had invalid sections. Try again.',
              })
            )
            controller.close()
            return
          }
        }

        // ── 10. Log generation in audit_log ───────────────────────────
        const supabase = await createClient()
        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'create',
          entity_type: 'ai_generation',
          metadata: {
            description: description.slice(0, 200),
            confidence: parsed.meta?.confidence || 'unknown',
            streaming: true,
          },
        })

        // ── 11. Calculate remaining generations ──────────────────────
        let remaining: number | null = null
        if (genLimit !== Infinity) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const { count: newCount } = await supabase
            .from('audit_log')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', 'create')
            .eq('entity_type', 'ai_generation')
            .gte('created_at', startOfMonth.toISOString())

          remaining = Math.max(0, genLimit - (newCount ?? 0))
        }

        // ── 12. Send complete event ──────────────────────────────────
        const meta = parsed.meta || {}

        controller.enqueue(
          sendEvent({
            type: 'complete',
            data: {
              title: meta.title || 'Generated Worksheet',
              description: meta.description || '',
              instructions: meta.instructions || '',
              estimatedMinutes: meta.estimated_minutes ?? null,
              tags: Array.isArray(meta.tags) ? meta.tags : [],
              schema: parsed.schema,
              confidence: meta.confidence || 'MEDIUM',
              interpretation: meta.interpretation || '',
              remaining,
            },
          })
        )
      } catch (err) {
        if (err instanceof Anthropic.APIError) {
          if (err.status === 429) {
            controller.enqueue(
              sendEvent({
                type: 'error',
                message: 'AI service is busy. Please wait a moment and try again.',
              })
            )
          } else {
            logger.error('Anthropic API error (stream)', err, { status: err.status })
            controller.enqueue(
              sendEvent({
                type: 'error',
                message: 'AI service temporarily unavailable. Please try again.',
              })
            )
          }
        } else {
          logger.error('Generate worksheet stream error', err)
          controller.enqueue(
            sendEvent({
              type: 'error',
              message: 'Something went wrong. Please try again.',
            })
          )
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
