'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

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
  'Analysing description…',
  'Selecting clinical model…',
  'Building worksheet structure…',
  'Generating fields…',
]

// Static preview data — a realistic "health anxiety maintenance formulation"
const DEMO_RESULT = {
  title: 'Health Anxiety Maintenance Formulation',
  description:
    'A clinical formulation mapping maintenance factors in health anxiety based on the Salkovskis cognitive-behavioural model.',
  instructions:
    'Complete this formulation collaboratively with your client in session. Explore each maintenance factor and how it connects to the central health anxiety cycle.',
  confidence: 'HIGH' as const,
  tags: ['health-anxiety', 'formulation', 'maintenance-model', 'CBT'],
  sections: [
    {
      title: 'Triggering event',
      description: 'What started this episode of health worry?',
      fields: ['Describe the trigger (e.g. physical sensation, news article, comment from someone)'],
    },
    {
      title: 'Negative interpretation',
      description: 'Catastrophic misinterpretation of the trigger',
      fields: ['What did you think was wrong?', 'How likely did it feel (0–100)?'],
    },
    {
      title: 'Anxiety response',
      description: 'Emotional and physical reaction',
      fields: ['Emotions experienced', 'Physical sensations noticed'],
    },
    {
      title: 'Safety behaviours',
      description: 'What did you do to cope or check?',
      fields: ['Checking / reassurance-seeking behaviours', 'Avoidance behaviours'],
    },
    {
      title: 'Maintaining factors',
      description: 'What keeps the cycle going?',
      fields: ['Selective attention to body', 'Reassurance effects (short vs long term)'],
    },
  ],
}

type TeaserState = 'input' | 'generating' | 'preview'

export function AIGenerateTeaser() {
  const [state, setState] = useState<TeaserState>('input')
  const [description, setDescription] = useState('')
  const [statusIndex, setStatusIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

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

  // Auto-transition to preview after simulated generation
  useEffect(() => {
    if (state !== 'generating') return
    timerRef.current = setTimeout(() => {
      setState('preview')
    }, 4000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state])

  const handleGenerate = useCallback(() => {
    if (!description.trim()) return
    setState('generating')
  }, [description])

  const handleReset = useCallback(() => {
    setState('input')
    setDescription('')
  }, [])

  return (
    <div className="mx-auto mt-12 max-w-2xl">
      {/* Input card */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
        <label htmlFor="ai-teaser-input" className="sr-only">Describe a worksheet</label>
        <textarea
          id="ai-teaser-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && description.trim() && state === 'input') {
              e.preventDefault()
              handleGenerate()
            }
          }}
          disabled={state !== 'input'}
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
            disabled={state !== 'input' || !description.trim()}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
          >
            {state === 'generating' ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating…
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {/* Progress bar during generation */}
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

      {/* Example prompt chips — only when input is empty */}
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
                className="rounded-full border border-primary-100 bg-surface px-3 py-1.5 text-xs text-primary-500 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview result */}
      {state === 'preview' && (
        <div className="relative mt-5">
          {/* Result card — faded at bottom */}
          <div className="overflow-hidden rounded-2xl border border-primary-100 bg-surface shadow-sm">
            {/* Header bar */}
            <div className="flex items-center gap-2.5 border-b border-primary-100 px-5 py-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary-700">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generated
              </div>
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                {DEMO_RESULT.confidence}
              </span>
              <div className="flex flex-wrap gap-1.5 ml-auto">
                {DEMO_RESULT.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Worksheet preview body */}
            <div className="px-5 pt-5 pb-0">
              <h3 className="text-xl font-bold text-primary-900">{DEMO_RESULT.title}</h3>
              <p className="mt-1.5 text-sm text-primary-500">{DEMO_RESULT.description}</p>

              <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light p-3 text-sm text-primary-700">
                {DEMO_RESULT.instructions}
              </div>

              {/* Mock section fields */}
              <div className="mt-5 space-y-4">
                {DEMO_RESULT.sections.slice(0, 3).map((section) => (
                  <div key={section.title}>
                    <h4 className="text-sm font-semibold text-primary-800">{section.title}</h4>
                    {section.description && (
                      <p className="mt-0.5 text-xs text-primary-400">{section.description}</p>
                    )}
                    <div className="mt-2 space-y-2">
                      {section.fields.map((field) => (
                        <div
                          key={field}
                          className="rounded-lg border border-primary-200 bg-primary-50/50 px-3 py-2.5 text-sm text-primary-300"
                        >
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fade-out gradient overlay */}
            <div className="relative h-32 -mt-4">
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/95 to-transparent" />
            </div>
          </div>

          {/* CTA overlay pinned to bottom of card */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-6">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-800 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-900 hover:-translate-y-px hover:shadow-xl"
            >
              Sign up free to save &amp; customise
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <button
              onClick={handleReset}
              className="text-xs text-primary-400 transition-colors hover:text-primary-600"
            >
              Try another description
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
