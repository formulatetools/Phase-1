'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'portal_bookmark_dismissed'

export function BookmarkBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if not previously dismissed
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore
    }
  }

  if (!visible) return null

  return (
    <div className="rounded-xl border border-brand/20 bg-brand-light p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <svg className="h-4 w-4 shrink-0 text-brand-dark" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
        <p className="text-xs text-primary-700">
          Bookmark this page to find your homework easily.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-lg px-2 py-1 text-xs text-primary-500 dark:text-primary-600 hover:bg-brand/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label="Dismiss bookmark suggestion"
      >
        Got it
      </button>
    </div>
  )
}
