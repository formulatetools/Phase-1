'use client'

import Link from 'next/link'
import { useAssign } from '@/components/providers/assign-provider'

export function ActionsCard() {
  const { openAssignModal } = useAssign()

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-4 sm:p-6 shadow-sm dark:border-primary-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-400 dark:text-primary-500">Actions</p>
      <div className="mt-4 space-y-1">
        {/* Primary CTA — Assign worksheet */}
        <button
          onClick={() => openAssignModal()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-brand/10 dark:text-primary-200 dark:hover:bg-brand/15"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
            <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <span className="flex-1 text-left">Assign worksheet</span>
          <svg className="h-4 w-4 text-primary-300 dark:text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Browse library */}
        <Link
          href="/worksheets"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          Browse library
        </Link>

        {/* Add client */}
        <Link
          href="/clients"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
            <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          Add client
        </Link>

        {/* Generate with AI */}
        <Link
          href="/my-tools/ai"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
            <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          Generate with AI
        </Link>
      </div>
    </div>
  )
}
