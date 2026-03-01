import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildGeneratePrompt } from '@/lib/ai/generate-prompt'
import { checkRateLimit } from '@/lib/rate-limit'
import type { WorksheetSchema } from '@/types/worksheet'
import Anthropic from '@anthropic-ai/sdk'

// AI call needs headroom beyond the default 10s
export const maxDuration = 60

/**
 * Unauthenticated demo endpoint: 1 free AI generation per IP per calendar month.
 * The generated worksheet is returned ephemerally — it is NOT saved to the
 * worksheets table. Visitors must sign up to save or send to clients.
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Resolve IP ──────────────────────────────────────────────────
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

    if (ip === 'unknown') {
      return NextResponse.json(
        { error: 'Could not determine your IP address.' },
        { status: 400 }
      )
    }

    // ── 2. In-memory burst protection (3 requests/minute per IP) ─────
    const burst = checkRateLimit(`demo-generate:${ip}`, 3, 60_000)
    if (!burst.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    // ── 3. Parse & validate body ─────────────────────────────────────
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

    // ── 4. Check monthly IP limit in Supabase ───────────────────────
    const supabase = createAdminClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('demo_generations')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', startOfMonth.toISOString())

    if (count !== null && count >= 1) {
      return NextResponse.json(
        {
          error: 'You\u2019ve already tried the demo this month. Create a free account to keep generating worksheets!',
          limitReached: true,
        },
        { status: 429 }
      )
    }

    // ── 5. Build prompt & call Claude ────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const prompt = buildGeneratePrompt(description)
    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    // ── 6. Parse AI response ─────────────────────────────────────────
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    const cleanedJson = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    let parsed: {
      meta?: {
        title?: string
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
      console.error('Demo AI returned invalid JSON:', cleanedJson.slice(0, 300))
      return NextResponse.json(
        {
          error:
            'Could not generate a worksheet from that description. Try being more specific (e.g. "health anxiety maintenance formulation" or "3-column thought record for social anxiety").',
        },
        { status: 422 }
      )
    }

    // ── 7. Basic validation ──────────────────────────────────────────
    if (!parsed.schema || !parsed.schema.sections) {
      return NextResponse.json(
        { error: 'Could not generate a valid worksheet. Try rephrasing your description.' },
        { status: 422 }
      )
    }

    for (const section of parsed.schema.sections) {
      if (!section.id || !Array.isArray(section.fields)) {
        return NextResponse.json(
          { error: 'Generated schema had invalid sections. Try again.' },
          { status: 422 }
        )
      }
    }

    // ── 8. Record the demo generation (consumes the IP's monthly slot)
    await supabase.from('demo_generations').insert({
      ip_address: ip,
      description: description.slice(0, 200),
    })

    // ── 9. Return ephemeral result (not saved to worksheets table) ───
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
    })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'AI service is busy. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      console.error('Anthropic API error (demo):', err.status, err.message)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    console.error('Demo generate error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
