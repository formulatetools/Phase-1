'use client'

import { useState, useEffect, useRef } from 'react'

const DISMISSED_KEY = 'portal_install_dismissed'
const INSTALLED_KEY = 'portal_installed'

type Platform = 'already_installed' | 'android' | 'ios_safari' | 'ios_other' | 'desktop'

function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop'

  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true

  if (isStandalone) return 'already_installed'
  if (isAndroid) return 'android'
  if (isSafari) return 'ios_safari'
  if (isIOS) return 'ios_other'
  return 'desktop'
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>('desktop')
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) || localStorage.getItem(INSTALLED_KEY)) {
        return
      }
    } catch {
      return
    }

    const detected = getPlatform()
    setPlatform(detected)

    // Don't show on desktop, non-Safari iOS, or already installed
    if (detected === 'desktop' || detected === 'ios_other' || detected === 'already_installed') {
      return
    }

    if (detected === 'android') {
      // Listen for the browser's install prompt
      const handler = (e: Event) => {
        e.preventDefault()
        deferredPromptRef.current = e as BeforeInstallPromptEvent
        setVisible(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }

    if (detected === 'ios_safari') {
      setVisible(true)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt()
      const result = await deferredPromptRef.current.userChoice
      deferredPromptRef.current = null
      setVisible(false)
      if (result.outcome === 'accepted') {
        try { localStorage.setItem(INSTALLED_KEY, 'true') } catch { /* */ }
      }
    }
  }

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, 'true') } catch { /* */ }
  }

  if (!visible) return null

  return (
    <div className="rounded-xl border border-primary-100 bg-surface p-3 shadow-sm">
      {platform === 'android' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-primary-600">
            Add to your home screen to access your homework like an app.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Add
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg px-2 py-1.5 text-xs text-primary-500 hover:bg-primary-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {platform === 'ios_safari' && (
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-primary-600 space-y-1">
            <p className="font-medium">Add to your home screen</p>
            <p>
              Tap the share button{' '}
              <span className="inline-block text-primary-800" aria-label="share icon">↑</span>
              {' '}at the bottom of your screen, then tap &quot;Add to Home Screen&quot;
              to access your homework like an app.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-primary-500 hover:bg-primary-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  )
}
