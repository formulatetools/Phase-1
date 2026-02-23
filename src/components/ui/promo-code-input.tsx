'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validatePromoCode, redeemPromoCode } from '@/app/(dashboard)/promo/actions'

interface PromoCodeInputProps {
  mode: 'validate' | 'redeem'
  onValidated?: (code: string, tier: string, tierLabel: string, durationDays: number) => void
}

export function PromoCodeInput({ mode, onValidated }: PromoCodeInputProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'validate') {
      const result = await validatePromoCode(code)
      if (result.valid) {
        setSuccess(`${result.tierLabel} access for ${result.durationDays} days`)
        onValidated?.(code, result.tier, result.tierLabel, result.durationDays)
      } else {
        setError(result.error)
      }
    } else {
      const result = await redeemPromoCode(code)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(`You've got ${result.durationDays} days of ${result.tierLabel} — enjoy!`)
        setCode('')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          disabled={loading || (mode === 'validate' && !!success)}
          className="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 uppercase tracking-wider focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !code.trim() || (mode === 'validate' && !!success)}
          className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Checking...' : mode === 'validate' ? 'Apply' : 'Redeem'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {success && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-green-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
    </div>
  )
}
