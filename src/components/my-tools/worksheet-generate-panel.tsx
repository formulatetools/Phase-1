'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { WorksheetSchema } from '@/types/worksheet'

interface GenerateResult {
  title: string
  description: string
  instructions: string
  estimatedMinutes: number | null
  tags: string[]
  schema: WorksheetSchema
}

interface WorksheetGeneratePanelProps {
  onGenerateComplete: (data: GenerateResult) => void
  disabled?: boolean
  tier: string
}

type GenerateState = 'idle' | 'generating' | 'success'

const EXAMPLE_PROMPTS = [
  'Health anxiety maintenance formulation',
  '3-column thought record for social anxiety',
  'Weekly activity schedule with pleasure and mastery',
  'Panic cycle formulation',
  'Behavioural experiment planner',
  'Worry log for GAD',
  'ERP exposure hierarchy for OCD',
  'Grounding techniques worksheet',
]

const STATUS_MESSAGES = [
  'Analysing description...',
  'Selecting clinical model...',
  'Building worksheet structure...',
  'Generating fields...',
]

export function WorksheetGeneratePanel({
  onGenerateComplete,
  disabled,
  tier,
}: WorksheetGeneratePanelProps) {
  const { toast } = useToast()
  const [state, setState] = useState<GenerateState>('idle')
  const [description, setDescription] = useState('')
  const [confidence, setConfidence] = useState<string | null>(null)
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [statusIndex, setStatusIndex] = useState(0)

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

  const handleGenerate = useCallback(async () => {
    const trimmed = description.trim()
    if (!trimmed) return

    setState('generating')
    setConfidence(null)
    setInterpretation(null)

    try {
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({ type: 'error', message: data.error || 'Failed to generate worksheet.' })
        setState('idle')
        return
      }

      setState('success')
      setConfidence(data.confidence || null)
      setInterpretation(data.interpretation || null)
      if (data.remaining !== null && data.remaining !== undefined) {
        setRemaining(data.remaining)
      }

      toast({
        type: 'success',
        message: 'Worksheet generated — review and edit below.',
      })

      onGenerateComplete({
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        estimatedMinutes: data.estimatedMinutes,
        tags: data.tags,
        schema: data.schema,
      })
    } catch {
      toast({ type: 'error', message: 'Network error. Check your connection and try again.' })
      setState('idle')
    }
  }, [description, onGenerateComplete, toast])

  const handleGenerateAgain = useCallback(() => {
    setState('idle')
    setDescription('')
    setConfidence(null)
    setInterpretation(null)
  }, [])

  // Tier blocked
  if (tier === 'free') {
    return (
      <div className="mb-6 rounded-xl border border-primary-100 bg-primary-50/50 px-5 py-4 dark:border-primary-800 dark:bg-primary-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              AI Worksheet Generation
            </p>
            <p className="mt-0.5 text-xs text-primary-500">
              Upgrade to Starter or above to generate worksheets from text descriptions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5 dark:border-green-800/40 dark:bg-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Generated from your description
              {confidence && (
                <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  confidence === 'HIGH'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : confidence === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                }`}>
                  {confidence}
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerateAgain}
            className="text-xs font-medium text-green-600 transition-colors hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            Generate another
          </button>
        </div>
        {interpretation && (
          <p className="mt-2 text-xs text-green-600/80 dark:text-green-500">
            {interpretation}
          </p>
        )}
        {remaining !== null && (
          <p className="mt-1 text-[10px] text-green-500/70 dark:text-green-600">
            {remaining} generation{remaining !== 1 ? 's' : ''} remaining this month
          </p>
        )}
      </div>
    )
  }

  // Collapsed state (for when user has scrolled into builder)
  if (collapsed && state === 'idle') {
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-100 bg-surface px-4 py-2.5 text-sm font-medium text-primary-500 transition-colors hover:border-brand/30 hover:text-brand dark:border-primary-700 dark:bg-primary-800/50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          Describe a worksheet to generate with AI
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="rounded-xl border border-primary-100 bg-surface p-5 dark:border-primary-700 dark:bg-primary-800/50">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-brand">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              Describe your worksheet
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-xs text-primary-400 transition-colors hover:text-primary-600"
            aria-label="Collapse"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Input + button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && description.trim() && state === 'idle') {
                handleGenerate()
              }
            }}
            disabled={disabled || state === 'generating'}
            placeholder="e.g. Health anxiety maintenance formulation"
            className="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50 dark:border-primary-600 dark:bg-primary-800 dark:text-primary-200 dark:placeholder:text-primary-500"
            maxLength={500}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled || state === 'generating' || !description.trim()}
            className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
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

        {/* Example prompts */}
        {state === 'idle' && !description && (
          <div className="mt-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary-400 dark:text-primary-500">
              Try:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.slice(0, 4).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setDescription(example)}
                  className="rounded-full border border-primary-100 bg-primary-50/50 px-2.5 py-1 text-[11px] text-primary-500 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand dark:border-primary-700 dark:bg-primary-800 dark:text-primary-400 dark:hover:border-brand/40 dark:hover:text-brand"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generating feedback */}
        {state === 'generating' && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-700">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent animate-shimmer" />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-primary-500 dark:text-primary-400">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
