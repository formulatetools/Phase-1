'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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

export function AIGenerateTeaser() {
  const router = useRouter()
  const [description, setDescription] = useState('')

  const handleGenerate = useCallback(() => {
    const trimmed = description.trim()
    if (!trimmed) return
    // Store the prompt so the AI generate page picks it up after signup
    localStorage.setItem('formulate_landing_prompt', trimmed)
    router.push('/signup?redirect=/my-tools/ai')
  }, [description, router])

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
            if (e.key === 'Enter' && !e.shiftKey && description.trim()) {
              e.preventDefault()
              handleGenerate()
            }
          }}
          placeholder="e.g. Health anxiety maintenance formulation based on the Salkovskis model"
          className="w-full resize-none rounded-xl border-0 bg-transparent px-1 py-2 text-base text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-0"
          rows={2}
          maxLength={500}
        />

        {/* Bottom row */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-primary-300">{description.length}/500</span>
          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Example prompt chips */}
      {!description && (
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

      {/* Signup nudge — visible once they've typed something */}
      {description.trim() && (
        <p className="mt-4 text-center text-xs text-primary-400">
          Create a free account to generate this worksheet with AI — your first generation is on us.
        </p>
      )}
    </div>
  )
}
