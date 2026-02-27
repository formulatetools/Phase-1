import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import { validateCustomSchema } from '@/lib/validation/custom-worksheet'
import { buildImportPrompt, buildFilledImportPrompt } from '@/lib/ai/import-prompt'
import type { SubscriptionTier } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import { stripPii } from '@/lib/pii/strip-pii'
import Anthropic from '@anthropic-ai/sdk'

// Hobby plan default is 10s — PDF parse + AI call needs more headroom
export const maxDuration = 60

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_TEXT_LENGTH = 12_000 // Limit text sent to AI to control cost

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────
    const { user, profile } = await getCurrentUser()
    if (!user || !profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // ── 2. Tier gate ─────────────────────────────────────────────────
    const tier = profile.subscription_tier as SubscriptionTier
    const limit = TIER_LIMITS[tier].maxCustomWorksheets

    if (limit === 0) {
      return NextResponse.json(
        { error: 'Upgrade to Standard or Professional to import worksheets.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { count } = await supabase
      .from('worksheets')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('is_curated', false)
      .is('deleted_at', null)

    if (count !== null && count >= limit) {
      return NextResponse.json(
        { error: `You've reached your plan's limit of ${limit} custom worksheets.` },
        { status: 403 }
      )
    }

    // ── 3. Parse file from FormData ──────────────────────────────────
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and Word (.docx) documents are supported.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File must be under 5MB.' },
        { status: 400 }
      )
    }

    // ── 4. Extract text ──────────────────────────────────────────────
    let extractedText: string

    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`[import-worksheet] Extracting text from ${file.type} (${file.size} bytes)`)

    if (file.type === 'application/pdf') {
      try {
        const { PDFParse } = await import('pdf-parse')
        console.log('[import-worksheet] pdf-parse imported OK')
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        const textResult = await parser.getText()
        extractedText = textResult.text
        await parser.destroy()
        console.log(`[import-worksheet] PDF text extracted: ${extractedText.length} chars`)
      } catch (pdfErr) {
        console.error('[import-worksheet] PDF parse failed:', pdfErr)
        return NextResponse.json(
          { error: 'Could not read this PDF. It may be scanned, encrypted, or corrupted.' },
          { status: 422 }
        )
      }
    } else {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }

    extractedText = extractedText.trim()

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract text from this file. Is it a scanned image?' },
        { status: 422 }
      )
    }

    // Truncate to control cost and prevent abuse
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.slice(0, MAX_TEXT_LENGTH)
    }

    // ── 4b. Strip PII before AI processing ───────────────────────────
    const { text: sanitisedText, strippedCounts } = stripPii(extractedText)

    if (strippedCounts.total > 0) {
      console.log(
        `[import-worksheet] Stripped ${strippedCounts.total} PII items:`,
        JSON.stringify(strippedCounts)
      )
    }

    // ── 5. Call Claude Haiku 4.5 ─────────────────────────────────────
    const filled = formData.get('filled') === 'true'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const prompt = filled
      ? buildFilledImportPrompt(sanitisedText)
      : buildImportPrompt(sanitisedText)

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    // ── 6. Parse AI response ─────────────────────────────────────────
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip accidental markdown fences
    const cleanedJson = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    let parsed: {
      title?: string
      description?: string
      instructions?: string
      estimatedMinutes?: number | null
      tags?: string[]
      schema?: WorksheetSchema
      responseValues?: Record<string, unknown>
    }

    try {
      parsed = JSON.parse(cleanedJson)
    } catch {
      console.error('AI returned invalid JSON:', cleanedJson.slice(0, 200))
      return NextResponse.json(
        { error: 'Could not analyse this document. Try a different file or build manually.' },
        { status: 422 }
      )
    }

    // ── 7. Validate schema ───────────────────────────────────────────
    if (!parsed.schema || !parsed.schema.sections) {
      return NextResponse.json(
        { error: 'Could not analyse this document. Try a different file or build manually.' },
        { status: 422 }
      )
    }

    const validation = validateCustomSchema(parsed.schema)
    if (!validation.valid) {
      console.error('AI schema failed validation:', validation.error)
      return NextResponse.json(
        { error: 'Could not analyse this document. Try a different file or build manually.' },
        { status: 422 }
      )
    }

    // ── 8. Return structured result ──────────────────────────────────
    const result: Record<string, unknown> = {
      title: parsed.title || 'Imported Worksheet',
      description: parsed.description || '',
      instructions: parsed.instructions || '',
      estimatedMinutes: parsed.estimatedMinutes ?? null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      schema: parsed.schema,
    }

    // Include response values for filled worksheet imports
    if (filled && parsed.responseValues && typeof parsed.responseValues === 'object') {
      result.responseValues = parsed.responseValues
    }

    return NextResponse.json(result)
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

    console.error('Import worksheet error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
