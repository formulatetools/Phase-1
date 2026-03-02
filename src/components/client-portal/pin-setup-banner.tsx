'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PinSetupBannerProps {
  portalToken: string
  appUrl: string
}

const DISMISS_KEY = 'portal_pin_setup_dismissed'

export function PinSetupBanner({ portalToken, appUrl }: PinSetupBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(true) // Start hidden, check localStorage
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  if (dismissed || success) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const handleDigitChange = (
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    value: string
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError(null)

    if (digit && index < 3) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    e: React.KeyboardEvent
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
    }
  }

  const handleEnterComplete = (completedDigits?: string[]) => {
    const pinDigits = completedDigits || pin
    if (pinDigits.every((d) => d)) {
      if (completedDigits) setPin(completedDigits)
      setStep('confirm')
      setConfirmPin(['', '', '', ''])
      setTimeout(() => confirmRefs.current[0]?.focus(), 100)
    }
  }

  const handleConfirmComplete = async (completedDigits?: string[]) => {
    const pinValue = pin.join('')
    const confirmValue = (completedDigits || confirmPin).join('')

    if (pinValue !== confirmValue) {
      setError('PINs don\'t match. Try again.')
      setConfirmPin(['', '', '', ''])
      setTimeout(() => confirmRefs.current[0]?.focus(), 100)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${appUrl}/api/client-portal/pin/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, pin: pinValue }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        // Refresh so the server component picks up the new PIN state
        router.refresh()
        return
      }

      setError(data.error || 'Failed to set PIN')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderDigitInputs = (
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete?: (completedDigits: string[]) => void
  ) => (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => {
            handleDigitChange(digits, setDigits, refs, i, e.target.value)
            // Auto-advance and check completion
            const newDigit = e.target.value.replace(/\D/g, '').slice(-1)
            if (newDigit && i === 3) {
              const newDigits = [...digits]
              newDigits[i] = newDigit
              if (newDigits.every((d) => d) && onComplete) {
                setTimeout(() => onComplete(newDigits), 50)
              }
            }
          }}
          onKeyDown={(e) => handleKeyDown(digits, setDigits, refs, i, e)}
          disabled={loading}
          className="h-11 w-10 rounded-lg border-2 border-primary-200 dark:border-primary-300 text-center text-lg font-bold text-primary-900 focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none disabled:opacity-50"
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  )

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
      {!showForm ? (
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
            <svg
              className="h-5 w-5 text-brand-dark"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary-800">
              Lock your workspace with a PIN
            </p>
            <p className="mt-0.5 text-xs text-primary-500 dark:text-primary-600">
              Add a 4-digit PIN so only you can access your therapy workspace.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  setShowForm(true)
                  setTimeout(() => pinRefs.current[0]?.focus(), 100)
                }}
                className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 transition-colors"
              >
                Set up
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs text-primary-500 dark:text-primary-600 hover:bg-primary-100 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-primary-800">
            {step === 'enter' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
          </p>

          {step === 'enter'
            ? renderDigitInputs(pin, setPin, pinRefs, handleEnterComplete)
            : renderDigitInputs(confirmPin, setConfirmPin, confirmRefs, handleConfirmComplete)
          }

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex justify-center gap-2">
            {step === 'enter' ? (
              <button
                onClick={() => handleEnterComplete()}
                disabled={!pin.every((d) => d) || loading}
                className="rounded-lg bg-primary-800 px-4 py-2 text-xs font-medium text-white hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setStep('enter')
                    setPin(['', '', '', ''])
                    setError(null)
                    setTimeout(() => pinRefs.current[0]?.focus(), 100)
                  }}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-xs text-primary-600 hover:bg-primary-50 dark:border-primary-300 dark:text-primary-700 dark:hover:bg-primary-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleConfirmComplete()}
                  disabled={!confirmPin.every((d) => d) || loading}
                  className="rounded-lg bg-primary-800 px-4 py-2 text-xs font-medium text-white hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Setting…' : 'Set PIN'}
                </button>
              </>
            )}
            <button
              onClick={() => {
                setShowForm(false)
                setStep('enter')
                setPin(['', '', '', ''])
                setConfirmPin(['', '', '', ''])
                setError(null)
              }}
              className="rounded-lg px-4 py-2 text-xs text-primary-400 hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
