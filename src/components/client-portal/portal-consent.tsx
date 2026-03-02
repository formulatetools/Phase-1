'use client'

import { useState } from 'react'
import { LogoIcon } from '@/components/ui/logo'

interface PortalConsentProps {
  portalToken: string
  onConsented: () => void
}

export function PortalConsent({ portalToken, onConsented }: PortalConsentProps) {
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/client-portal/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to record consent')
      }

      onConsented()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (dismissed) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-primary-100 bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-primary-500 dark:text-primary-700">
            No worries. You can still complete individual homework via the links
            your therapist shares with you.
          </p>
          <p className="mt-3 text-xs text-primary-400 dark:text-primary-600">
            If you change your mind, visit this page again to access your
            workspace.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main card */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light">
            <LogoIcon size={20} />
          </div>
          <h1 className="text-xl font-bold text-primary-900">
            Your Therapy Workspace
          </h1>
        </div>

        <p className="mt-4 text-sm text-primary-600">
          Your therapist has set up a personal space for you to view and complete
          your therapy homework.
        </p>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium text-primary-700">
            From here you can:
          </p>
          <ul className="space-y-1.5 text-sm text-primary-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">•</span>
              See all your current and past assignments
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">•</span>
              Complete homework at your own pace
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">•</span>
              Look back at previous responses
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">•</span>
              Delete any of your data at any time
            </li>
          </ul>
        </div>

        {/* Data handling info */}
        <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
          <p className="text-xs font-semibold text-primary-700">
            How your data is handled
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-primary-500 dark:text-primary-600">
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              You are identified by a code, not your name
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Only your therapist can see your responses
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Your data is encrypted and stored securely
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              You can delete any or all of your data at any time
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              This link is private — don&apos;t share it
            </li>
          </ul>
        </div>

        {/* Legal text */}
        <p className="mt-5 text-xs text-primary-400 dark:text-primary-600">
          By continuing you agree to our{' '}
          <a href="/privacy" className="underline hover:text-primary-600">Privacy Policy</a>
          {' '}and{' '}
          <a href="/terms" className="underline hover:text-primary-600">Terms of Use</a>.
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 disabled:opacity-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            {loading ? 'Setting up…' : 'Continue to My Workspace'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-primary-200 px-5 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:border-primary-300 dark:text-primary-700 dark:hover:bg-primary-100 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
