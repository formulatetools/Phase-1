'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface WorksheetsPageTabsProps {
  customWorksheetCount: number
  canCreate: boolean
}

export function WorksheetsPageTabs({
  customWorksheetCount,
  canCreate,
}: WorksheetsPageTabsProps) {
  const pathname = usePathname()
  const isMinePage = pathname === '/worksheets/mine'

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-lg bg-primary-100 p-1 dark:bg-primary-800" role="tablist" aria-label="Worksheet views">
        <Link
          href="/worksheets"
          role="tab"
          aria-selected={!isMinePage}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            !isMinePage
              ? 'bg-surface text-primary-900 shadow-sm dark:bg-primary-700 dark:text-primary-50'
              : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200'
          }`}
        >
          All Resources
        </Link>
        <Link
          href="/worksheets/mine"
          role="tab"
          aria-selected={isMinePage}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            isMinePage
              ? 'bg-surface text-primary-900 shadow-sm dark:bg-primary-700 dark:text-primary-50'
              : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200'
          }`}
        >
          My Worksheets ({customWorksheetCount})
        </Link>
      </div>

      {canCreate && (
        <div className="flex items-center gap-2">
          <Link
            href="/my-tools/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create new
          </Link>
          <Link
            href="/my-tools/ai"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            Generate with AI
          </Link>
        </div>
      )}
    </div>
  )
}
