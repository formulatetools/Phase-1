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

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="mx-auto max-w-lg rounded-2xl border border-primary-200 bg-white p-4 shadow-lg pointer-events-auto">
        <p className="text-sm text-primary-700">
          We use essential cookies to keep you signed in and functional cookies to improve your experience.
          No advertising or tracking cookies are used.{' '}
          <Link href="/privacy" className="font-medium underline underline-offset-2 hover:text-primary-900">
            Privacy Policy
          </Link>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={accept}
            className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={decline}
            className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  )
}
