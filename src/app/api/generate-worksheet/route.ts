import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { validateCustomSchema } from '@/lib/validation/custom-worksheet'
import {
  buildGeneratePrompt,
  buildGeneratePromptWithContext,
} from '@/lib/ai/generate-prompt'
import type { SubscriptionTier } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import Anthropic from '@anthropic-ai/sdk'

// Hobby plan default is 10s — AI call needs more headroom
export const maxDuration = 60

// Monthly generation limits per tier
const AI_GENERATION_LIMITS: Record<string, number> = {
  free: 0,
  starter: 3,
  standard: 10,
  professional: Infinity,
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────
    const { user, profile } = await getCurrentUser()
    if (!user || !profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // ── 2. Tier gate ─────────────────────────────────────────────────
    const tier = profile.subscription_tier as SubscriptionTier
    const genLimit = AI_GENERATION_LIMITS[tier] ?? 0

    if (genLimit === 0) {
      return NextResponse.json(
        { error: 'AI worksheet generation is available on Starter plans and above.' },
        { status: 403 }
      )
    }

    // Check custom worksheet count limit too
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
        return NextResponse.json(
          { error: `You've reached your plan's limit of ${wsLimit} custom worksheets.` },
          { status: 403 }
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
        return NextResponse.json(
          {
            error: `You've used all ${genLimit} AI generations this month. Resets on the 1st.`,
            remaining: 0,
          },
          { status: 429 }
        )
      }
    }

    // ── 4. Parse request body ────────────────────────────────────────
    const body = await request.json()
    const description = typeof body.description === 'string' ? body.description.trim() : ''

    if (!description) {
      return NextResponse.json(
        { error: 'Please describe the worksheet you want to create.' },
        { status: 400 }
      )
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: 'Description is too long. Keep it under 500 characters.' },
        { status: 400 }
      )
    }

    // ── 5. Build prompt ──────────────────────────────────────────────
    const context = body.clientContext as
      | { presentation?: string; stage?: string; previousWorksheets?: string[] }
      | undefined

    const prompt =
      context && (context.presentation || context.stage || context.previousWorksheets?.length)
        ? buildGeneratePromptWithContext(description, context)
        : buildGeneratePrompt(description)

    // ── 6. Call Claude ───────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    // ── 7. Parse AI response ─────────────────────────────────────────
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

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
      console.error('AI returned invalid JSON:', cleanedJson.slice(0, 300))
      return NextResponse.json(
        {
          error:
            'Could not generate a worksheet from that description. Try being more specific (e.g. "health anxiety maintenance formulation" or "3-column thought record for social anxiety").',
        },
        { status: 422 }
      )
    }

    // ── 8. Validate schema ───────────────────────────────────────────
    if (!parsed.schema || !parsed.schema.sections) {
      return NextResponse.json(
        {
          error:
            'Could not generate a valid worksheet. Try rephrasing your description.',
        },
        { status: 422 }
      )
    }

    // The generate prompt can produce formulation and record fields which
    // the standard validateCustomSchema blocks. We do a lighter validation:
    // just check sections exist with fields that have IDs and types.
    for (const section of parsed.schema.sections) {
      if (!section.id || !Array.isArray(section.fields)) {
        return NextResponse.json(
          { error: 'Generated schema had invalid sections. Try again.' },
          { status: 422 }
        )
      }
    }

    // ── 9. Log generation in audit_log ───────────────────────────────
    const supabase = await createClient()
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'ai_generation',
      metadata: {
        description: description.slice(0, 200),
        confidence: parsed.meta?.confidence || 'unknown',
      },
    })

    // ── 10. Calculate remaining generations ──────────────────────────
    let remaining: number | null = null
    if (genLimit !== Infinity) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newCount } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'create')
        .eq('entity_type', 'ai_generation')
        .gte('created_at', startOfMonth.toISOString())

      remaining = Math.max(0, genLimit - (newCount ?? 0))
    }

    // ── 11. Return structured result ─────────────────────────────────
    const meta = parsed.meta || {}

    return NextResponse.json({
      title: meta.title || 'Generated Worksheet',
      description: meta.description || '',
      instructions: meta.instructions || '',
      estimatedMinutes: meta.estimated_minutes ?? null,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      schema: parsed.schema,
      confidence: meta.confidence || 'MEDIUM',
      interpretation: meta.interpretation || '',
      remaining,
    })
  } catch (err) {
    // Handle Anthropic-specific errors
    if (err instanceof Anthropic.APIError) {
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'AI service is busy. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      console.error('Anthropic API error:', err.status, err.message)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    console.error('Generate worksheet error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
