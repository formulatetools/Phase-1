'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { ConsentGate } from '@/components/homework/consent-gate'
import { buttonVariants } from '@/components/ui/button-variants'
import type { WorksheetSchema } from '@/types/worksheet'
import { DEMO_DATA, DEMO_WORKSHEETS } from '@/lib/demo-data'

// Icon map — matches the icon slugs in DEMO_WORKSHEETS
const ICONS: Record<string, React.ReactNode> = {
  'thought-record': (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  hierarchy: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  ),
  schedule: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
}

interface DemoWorksheet {
  slug: string
  title: string
  description: string | null
  instructions: string | null
  schema: WorksheetSchema
}

interface WorksheetPreviewProps {
  worksheets: DemoWorksheet[]
}

export function WorksheetPreview({ worksheets }: WorksheetPreviewProps) {
  const [activeSlug, setActiveSlug] = useState(worksheets[0]?.slug ?? '')
  // Track consent state per tab so switching tabs resets the journey
  const [consentKeys, setConsentKeys] = useState<Record<string, number>>({})

  const activeWorksheet = worksheets.find((w) => w.slug === activeSlug)
  const demoValues = DEMO_DATA[activeSlug]

  const handleTabChange = useCallback((slug: string) => {
    setActiveSlug(slug)
    // Bump the key so ConsentGate remounts and resets its state
    setConsentKeys((prev) => ({ ...prev, [slug]: (prev[slug] ?? 0) + 1 }))
  }, [])

  if (!activeWorksheet) return null

  return (
    <div className="mx-auto max-w-3xl">
      {/* Tabs */}
      <div className="mb-4 flex justify-center">
        <div role="tablist" aria-label="Demo worksheets" className="inline-flex rounded-xl border border-primary-200 bg-primary-50/50 p-1 gap-1">
          {worksheets.map((ws) => {
            const meta = DEMO_WORKSHEETS.find((m) => m.slug === ws.slug)
            const isActive = ws.slug === activeSlug
            return (
              <button
                key={ws.slug}
                role="tab"
                aria-selected={isActive}
                aria-controls="worksheet-preview-panel"
                onClick={() => handleTabChange(ws.slug)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-surface text-brand shadow-sm'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-surface/50'
                }`}
              >
                {meta && ICONS[meta.icon]}
                <span className="hidden sm:inline">{ws.title}</span>
                <span className="sm:hidden">{ws.title.split(' ').slice(0, 2).join(' ')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Browser-chrome wrapper */}
      <div id="worksheet-preview-panel" role="tabpanel" className="rounded-2xl border border-primary-200 bg-surface shadow-xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-primary-100 bg-primary-50/50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
          </div>
          <p className="text-xs font-medium text-primary-500">
            {activeWorksheet.title}
          </p>
          <span className="ml-auto rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            Interactive
          </span>
        </div>

        {/* Content area */}
        <div className="max-h-[600px] overflow-y-auto">
          <ConsentGate
            key={`${activeSlug}-${consentKeys[activeSlug] ?? 0}`}
            token="demo"
            initialHasConsent={false}
            worksheetTitle={activeWorksheet.title}
            worksheetSchema={activeWorksheet.schema}
            isDemo
          >
            {/* Post-consent: the worksheet form with demo data */}
            <div className="p-4 sm:p-6">
              {activeWorksheet.description && (
                <p className="mb-2 text-sm text-primary-500">{activeWorksheet.description}</p>
              )}
              {activeWorksheet.instructions && (
                <div className="mb-6 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm text-primary-700">
                  {activeWorksheet.instructions}
                </div>
              )}
              <WorksheetRenderer
                key={activeSlug}
                schema={activeWorksheet.schema}
                readOnly={false}
                initialValues={demoValues}
              />

              {/* Signup CTA — appears at the bottom of the interactive form */}
              <div className="mt-10 border-t border-primary-100 pt-6 text-center">
                <p className="text-sm font-medium text-primary-700">
                  Like what you see? Send this to a client in under a minute.
                </p>
                <Link
                  href="/signup"
                  className={`mt-3 inline-flex ${buttonVariants.accent('md')}`}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </ConsentGate>
        </div>
      </div>

      {/* Caption + link */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <p className="text-center text-sm text-primary-400">
          This is the exact journey your clients go through — from consent to completion.
        </p>
        <Link
          href={`/hw/demo/${activeSlug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          Try the full experience
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
