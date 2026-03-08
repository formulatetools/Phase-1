'use client'

import { useEffect } from 'react'

/**
 * Registers the enhanced portal service worker on homework pages.
 * This enables offline caching of page shells and API responses
 * so clients can continue working even without connectivity.
 */
export function HomeworkSwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/portal-sw.js', { scope: '/' })
        .catch(() => {
          // Service worker registration failed — not critical
        })
    }
  }, [])

  return null
}
