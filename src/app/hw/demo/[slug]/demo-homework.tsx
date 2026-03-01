'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { HomeworkForm } from '@/components/homework/homework-form'
import type { WorksheetSchema } from '@/types/worksheet'

interface DemoHomeworkProps {
  slug: string
  title: string
  description: string | null
  instructions: string | null
  schema: WorksheetSchema
  demoData?: Record<string, unknown>
}

export function DemoHomework({
  slug,
  title,
  description,
  instructions,
  schema,
  demoData,
}: DemoHomeworkProps) {
  const [showExample, setShowExample] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="sticky top-0 z-50 border-b border-blue-300 bg-blue-50 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Demo — this is what your client sees. Nothing is saved.</span>
            <span className="sm:hidden">Client view demo</span>
          </div>

          {/* Toggle */}
          {demoData && (
            <div className="flex items-center rounded-lg border border-blue-200 bg-white p-0.5 text-xs">
              <button
                onClick={() => setShowExample(true)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  showExample
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                Example
              </button>
              <button
                onClick={() => setShowExample(false)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  !showExample
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                Blank
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client-facing header (matches /hw/[token]) */}
      <header className="border-t-[3px] border-t-brand border-b border-b-primary-100 bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-primary-800">Formulate</span>
          </div>
          <span className="text-xs text-primary-400">
            Due {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Worksheet header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-primary-500">{description}</p>
          )}
          {instructions && (
            <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm text-primary-700">
              {instructions}
            </div>
          )}
        </div>

        {/* Homework form in preview mode */}
        <HomeworkForm
          key={showExample ? 'example' : 'blank'}
          token="demo"
          schema={schema}
          existingResponse={showExample && demoData ? demoData : undefined}
          isCompleted={false}
          readOnly={false}
          isPreview={true}
          worksheetTitle={title}
          worksheetDescription={description}
          worksheetInstructions={instructions}
          portalUrl={null}
          prefillData={null}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-6">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-1.5 text-xs text-primary-400">
              <LogoIcon size={12} />
              <span>Powered by Formulate</span>
            </div>
            <Link
              href={`/worksheets/${slug}`}
              className="text-xs font-medium text-brand hover:text-brand-dark transition-colors"
            >
              &larr; Back to worksheet details
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
