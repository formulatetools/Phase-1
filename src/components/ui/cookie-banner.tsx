'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'formulate_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if no consent decision has been stored
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(COOKIE_KEY, 'acknowledged')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="mx-auto max-w-lg rounded-2xl border border-primary-200 bg-surface p-4 shadow-lg pointer-events-auto">
        <p className="text-sm text-primary-700">
          We use essential cookies to keep you signed in. No tracking, advertising, or third-party cookies are used.
          Analytics are fully cookieless.{' '}
          <Link href="/privacy" className="font-medium underline underline-offset-2 hover:text-primary-900">
            Privacy Policy
          </Link>
        </p>
        <div className="mt-3">
          <button
            onClick={dismiss}
            className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
