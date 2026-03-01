'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PinEntryProps {
  portalToken: string
  appUrl: string
}

export function PinEntry({ portalToken, appUrl }: PinEntryProps) {
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [lockedOut, setLockedOut] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError(null)

    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3 && newDigits.every((d) => d)) {
      handleSubmit(newDigits.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move back on backspace when current field is empty
      inputRefs.current[index - 1]?.focus()
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      const newDigits = pasted.split('')
      setDigits(newDigits)
      inputRefs.current[3]?.focus()
      handleSubmit(pasted)
    }
  }

  const handleSubmit = async (pin?: string) => {
    const pinValue = pin || digits.join('')
    if (pinValue.length !== 4) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${appUrl}/api/client-portal/pin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, pin: pinValue }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Refresh the page — server component will now see the valid cookie
        router.refresh()
        return
      }

      if (res.status === 429) {
        setLockedOut(true)
        setError('Too many attempts. Please try again in 15 minutes.')
        return
      }

      if (res.status === 401) {
        setError('Incorrect PIN')
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining)
        }
        // Clear digits and refocus
        setDigits(['', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        return
      }

      setError(data.error || 'Something went wrong')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-sm rounded-2xl border border-primary-200 bg-surface p-8 shadow-sm text-center">
        {/* Lock icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <svg
            className="h-7 w-7 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-primary-900">
          Enter your PIN
        </h2>
        <p className="mt-1 text-xs text-primary-500">
          This workspace is protected with a PIN.
        </p>

        {/* PIN inputs */}
        <div className="mt-6 flex justify-center gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={loading || lockedOut}
              className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold transition-colors focus:outline-none ${
                error
                  ? 'border-red-300 text-red-700 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-primary-200 text-primary-900 focus:border-brand focus:ring-2 focus:ring-brand/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4">
            <p className="text-sm text-red-600">{error}</p>
            {attemptsRemaining !== null && attemptsRemaining > 0 && !lockedOut && (
              <p className="mt-1 text-xs text-red-400">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        )}

        {/* Submit button (for cases where auto-submit doesn't trigger) */}
        {!lockedOut && (
          <button
            onClick={() => handleSubmit()}
            disabled={loading || digits.some((d) => !d)}
            className="mt-6 w-full rounded-xl bg-primary-800 px-4 py-3 text-sm font-medium text-white hover:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Unlock'}
          </button>
        )}

        <p className="mt-4 text-[10px] text-primary-400">
          Forgot your PIN? Ask your therapist to reset it.
        </p>
      </div>
    </div>
  )
}
