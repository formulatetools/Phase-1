'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Monitors real connectivity — combines navigator.onLine with
 * actual request success/failure. This lets us detect "connected
 * to Wi-Fi but no internet" scenarios.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Let the caller manually mark offline (e.g. on fetch failure)
  const markOffline = useCallback(() => setIsOnline(false), [])
  // Let the caller manually mark online (e.g. on successful save)
  const markOnline = useCallback(() => setIsOnline(true), [])

  return { isOnline, markOffline, markOnline }
}
