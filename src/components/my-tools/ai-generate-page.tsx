'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { LogoIcon } from '@/components/ui/logo'
import { createCustomWorksheet } from '@/app/(dashboard)/my-tools/actions'
import { useToast } from '@/hooks/use-toast'

interface AIGeneratePageProps {
  tier: string
  atLimit: boolean
}

interface GenerateResult {
  title: string
  description: string
  instructions: string
  estimatedMinutes: number | null
  tags: string[]
  schema: WorksheetSchema
  confidence?: string
  interpretation?: string
  remaining?: number | null
}

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

type PageState = 'input' | 'generating' | 'preview'

export function AIGeneratePage({ tier, atLimit }: AIGeneratePageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [state, setState] = useState<PageState>('input')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusIndex, setStatusIndex] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cycle status messages during generation
  useEffect(() => {
    if (state !== 'generating') {
      setStatusIndex(0)
      return
    }
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [state])

  // Check localStorage for a prompt from the landing page teaser
  const autoTriggered = useRef(false)
  useEffect(() => {
    const landingPrompt = localStorage.getItem('formulate_landing_prompt')
    if (landingPrompt) {
      localStorage.removeItem('formulate_landing_prompt')
      autoTriggered.current = true
      setDescription(landingPrompt)
    } else {
      inputRef.current?.focus()
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    const trimmed = description.trim()
    if (!trimmed) return

    setState('generating')

    try {
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({ type: 'error', message: data.error || 'Failed to generate worksheet.' })
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
        remaining: data.remaining,
      })
      setState('preview')
    } catch {
      toast({ type: 'error', message: 'Network error. Check your connection and try again.' })
      setState('input')
    }
  }, [description, toast])

  // Auto-trigger generation when pre-filled from landing page
  useEffect(() => {
    if (autoTriggered.current && description && state === 'input') {
      autoTriggered.current = false
      handleGenerate()
    }
  }, [description, state, handleGenerate])

  const handleSave = useCallback(async () => {
    if (!result) return
    setSaving(true)

    const res = await createCustomWorksheet(
      result.title,
      result.description,
      result.instructions,
      result.schema,
      null, // category
      result.tags,
      result.estimatedMinutes
    )

    if (res.error) {
      toast({ type: 'error', message: res.error })
      setSaving(false)
    } else {
      toast({ type: 'success', message: 'Saved to My Tools!' })
      router.push(`/my-tools/${res.id}`)
    }
  }, [result, router, toast])

  const handleEditInBuilder = useCallback(() => {
    if (!result) return
    // Store generated data in sessionStorage for the builder to pick up
    sessionStorage.setItem(
      'formulate_ai_draft',
      JSON.stringify({
        title: result.title,
        description: result.description,
        instructions: result.instructions,
        tags: result.tags,
        estimated_minutes: result.estimatedMinutes,
        schema: result.schema,
      })
    )
    router.push('/my-tools/new')
  }, [result, router])

  const handleGenerateAnother = useCallback(() => {
    setState('input')
    setResult(null)
    setDescription('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // ── At custom worksheet limit ─────────────────────────────────────
  if (atLimit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900">AI Worksheet Generator</h1>
        <p className="mt-2 text-sm text-primary-500">
          You&apos;ve reached your plan&apos;s custom worksheet limit. Upgrade or delete existing tools to create more.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/my-tools"
            className="rounded-xl border border-primary-200 px-5 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            Manage tools
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            Upgrade
          </Link>
        </div>
      </div>
    )
  }

  // ── Preview state ──────────────────────────────────────────────────
  if (state === 'preview' && result) {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 border-b border-primary-100 bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary-700">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Generated
              </div>
              {result.confidence && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  result.confidence === 'HIGH'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : result.confidence === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {result.confidence}
                </span>
              )}
              {result.remaining !== null && result.remaining !== undefined && (
                <span className="text-[10px] text-primary-400">
                  {result.remaining} left this month
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tier === 'free' ? (
                <Link
                  href="/pricing"
                  className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
                >
                  Upgrade to Save
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save to My Tools'}
                  </button>
                  <button
                    onClick={handleEditInBuilder}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    Edit in Builder
                  </button>
                </>
              )}
              <button
                onClick={handleGenerateAnother}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                New
              </button>
            </div>
          </div>
        </div>

        {/* Worksheet preview */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            {/* Header */}
            <h1 className="text-2xl font-bold text-primary-900">
              {result.title}
            </h1>
            {result.description && (
              <p className="mt-2 text-sm text-primary-500">{result.description}</p>
            )}
            {result.instructions && (
              <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm text-primary-700">
                {result.instructions}
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-600">
              This worksheet was created by your therapist, not by Formulate.
              Formulate does not review or validate custom clinical content.
            </div>

            {/* Rendered worksheet */}
            {result.schema.sections.length > 0 ? (
              <WorksheetRenderer
                schema={result.schema}
                readOnly={false}
              />
            ) : (
              <div className="py-12 text-center text-sm text-primary-300">
                No sections generated
              </div>
            )}

            {/* Interpretation */}
            {result.interpretation && (
              <div className="mt-8 rounded-xl border border-primary-100 bg-primary-50/50 p-4 text-xs text-primary-500">
                <span className="font-medium">AI note:</span> {result.interpretation}
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 flex items-center justify-center gap-1.5 text-xs text-primary-400">
              <LogoIcon size={14} />
              <span>Formulate</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Input / Generating state ──────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">
          Describe a worksheet
        </h1>
        <p className="mt-2 text-sm text-primary-500">
          Tell us what you need and we&apos;ll generate a complete clinical worksheet in seconds.
        </p>
      </div>

      {/* Input area */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm dark:border-primary-700 dark:bg-primary-800/50">
        <textarea
          ref={inputRef}
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
          className="w-full resize-none rounded-xl border-0 bg-transparent px-1 py-2 text-base text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-0 disabled:opacity-50 dark:text-primary-200 dark:placeholder:text-primary-500"
          rows={3}
          maxLength={500}
        />

        {/* Bottom row: char count + generate button */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-primary-300">
            {description.length}/500
          </span>
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
              'Generate'
            )}
          </button>
        </div>

        {/* Shimmer progress bar during generation */}
        {state === 'generating' && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-700">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent animate-shimmer" />
            </div>
            <p className="mt-2 text-center text-xs text-primary-500 transition-opacity">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        )}
      </div>

      {/* Example prompts */}
      {state === 'input' && !description && (
        <div className="mt-6">
          <p className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-wider text-primary-400">
            Try one of these
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => setDescription(example)}
                className="rounded-full border border-primary-100 bg-surface px-3 py-1.5 text-xs text-primary-500 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand dark:border-primary-700 dark:bg-primary-800 dark:text-primary-400 dark:hover:border-brand/40 dark:hover:text-brand"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Build manually link */}
      <div className="mt-8 text-center">
        <Link
          href="/my-tools/new"
          className="text-xs text-primary-400 transition-colors hover:text-primary-600"
        >
          Or build a tool manually →
        </Link>
      </div>
    </div>
  )
}
