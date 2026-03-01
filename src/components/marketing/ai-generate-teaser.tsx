'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'

const EXAMPLE_PROMPTS = [
  'Health anxiety maintenance formulation',
  '3-column thought record for social anxiety',
  'Panic cycle formulation',
  'Behavioural experiment planner',
  'Weekly activity schedule with pleasure and mastery',
  'Worry log for GAD',
  'CFT three systems formulation',
  'Grounding techniques worksheet',
]

const STATUS_MESSAGES = [
  'Analysing description...',
  'Selecting clinical model...',
  'Building worksheet structure...',
  'Generating fields...',
]

interface DemoResult {
  title: string
  description: string
  instructions: string
  estimatedMinutes: number | null
  tags: string[]
  schema: WorksheetSchema
  confidence?: string
  interpretation?: string
}

type TeaserState = 'input' | 'generating' | 'preview' | 'limit_reached'

export function AIGenerateTeaser() {
  const [state, setState] = useState<TeaserState>('input')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<DemoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusIndex, setStatusIndex] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cycle status messages during generation
  useEffect(() => {
    if (state !== 'generating') return
    setStatusIndex(0) // eslint-disable-line react-hooks/set-state-in-effect -- reset index at start of generation cycle
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [state])

  const handleGenerate = useCallback(async () => {
    const trimmed = description.trim()
    if (!trimmed) return

    setState('generating')
    setError(null)

    try {
      const response = await fetch('/api/demo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.limitReached) {
          setState('limit_reached')
          return
        }
        setError(data.error || 'Failed to generate worksheet.')
        setState('input')
        return
      }

      setResult({
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        estimatedMinutes: data.estimatedMinutes,
        tags: data.tags,
        schema: data.schema,
        confidence: data.confidence,
        interpretation: data.interpretation,
      })
      setState('preview')
    } catch {
      setError('Network error. Check your connection and try again.')
      setState('input')
    }
  }, [description])

  // ── Limit reached state ──────────────────────────────────────────
  if (state === 'limit_reached') {
    return (
      <div className="mx-auto mt-12 max-w-2xl text-center">
        <div className="rounded-2xl border border-primary-100 bg-surface p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-primary-900">
            You&apos;ve used your free demo
          </h3>
          <p className="mt-2 text-sm text-primary-500">
            Create a free account to generate more worksheets — your first generation after signup is on us.
          </p>
          <Link
            href="/signup?redirect=/my-tools/ai"
            className="mt-5 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            Get started free
          </Link>
        </div>
      </div>
    )
  }

  // ── Preview state — full interactive worksheet ───────────────────
  if (state === 'preview' && result) {
    return (
      <div className="mx-auto mt-12 max-w-2xl">
        {/* Result header */}
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Generated in seconds
          </div>
        </div>

        {/* Worksheet card */}
        <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm">
          <div className="border-b border-primary-100 px-6 py-5">
            <h3 className="text-xl font-bold text-primary-900">{result.title}</h3>
            {result.description && (
              <p className="mt-1.5 text-sm text-primary-500">{result.description}</p>
            )}
            {result.instructions && (
              <div className="mt-3 rounded-lg border border-brand/20 bg-brand-light px-4 py-3 text-sm text-primary-700">
                {result.instructions}
              </div>
            )}
            {result.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live worksheet preview */}
          <div className="px-6 py-6">
            {result.schema.sections.length > 0 ? (
              <WorksheetRenderer schema={result.schema} readOnly={false} />
            ) : (
              <div className="py-8 text-center text-sm text-primary-300">
                No sections generated
              </div>
            )}
          </div>
        </div>

        {/* Signup CTAs */}
        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-light p-6 text-center">
          <h4 className="text-base font-semibold text-primary-900">
            Like what you see?
          </h4>
          <p className="mt-1.5 text-sm text-primary-500">
            Sign up to save this worksheet, customise it, and send it to clients.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup?redirect=/my-tools/ai"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Save &amp; customise
            </Link>
            <Link
              href="/signup?redirect=/my-tools/ai"
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-surface px-6 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Send to a client
            </Link>
          </div>
        </div>

        {/* AI note */}
        {result.interpretation && (
          <p className="mt-4 text-center text-xs text-primary-400">
            <span className="font-medium">AI note:</span> {result.interpretation}
          </p>
        )}
      </div>
    )
  }

  // ── Input / Generating state ─────────────────────────────────────
  return (
    <div className="mx-auto mt-12 max-w-2xl">
      {/* Input card */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
        <label htmlFor="ai-teaser-input" className="sr-only">Describe a worksheet</label>
        <textarea
          ref={inputRef}
          id="ai-teaser-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && description.trim() && state === 'input') {
              e.preventDefault()
              handleGenerate()
            }
          }}
          disabled={state === 'generating'}
          placeholder="e.g. Health anxiety maintenance formulation based on the Salkovskis model"
          className="w-full resize-none rounded-xl border-0 bg-transparent px-1 py-2 text-base text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-0 disabled:opacity-50"
          rows={2}
          maxLength={500}
        />

        {/* Bottom row */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-primary-300">{description.length}/500</span>
          <button
            onClick={handleGenerate}
            disabled={state === 'generating' || !description.trim()}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
          >
            {state === 'generating' ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate — it\u2019s free'
            )}
          </button>
        </div>

        {/* Shimmer progress bar during generation */}
        {state === 'generating' && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent animate-shimmer" />
            </div>
            <p className="mt-2 text-center text-xs text-primary-500 transition-opacity">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-center text-sm text-red-600">{error}</p>
      )}

      {/* Example prompt chips */}
      {state === 'input' && !description && (
        <div className="mt-5">
          <p className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-wider text-primary-400">
            Try one of these
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => setDescription(example)}
                className="rounded-full border border-primary-100 bg-surface px-3.5 py-2.5 text-xs text-primary-500 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtle reassurance — visible once they've typed something */}
      {state === 'input' && description.trim() && (
        <p className="mt-4 text-center text-xs text-primary-400">
          No signup required — try it now and see the real output.
        </p>
      )}
    </div>
  )
}
