'use client'

import { useState, useEffect } from 'react'
import { STRIPE_PRICES, TIER_PRICES, TIER_LABELS } from '@/lib/stripe/config'

interface AnnualUpgradeBannerProps {
  tier: string
  stripePriceId: string | null
}

const DISMISS_KEY = 'annual-nudge-dismissed'

// Monthly price IDs
const MONTHLY_PRICE_IDS = [
  STRIPE_PRICES.starter.monthly,
  STRIPE_PRICES.standard.monthly,
  STRIPE_PRICES.professional.monthly,
]

export function AnnualUpgradeBanner({ tier, stripePriceId }: AnnualUpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(true) // Start hidden, reveal after mount
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  // Only show for monthly subscribers
  if (!stripePriceId || !MONTHLY_PRICE_IDS.includes(stripePriceId)) return null
  if (dismissed) return null

  const tierKey = tier as keyof typeof TIER_PRICES
  const prices = TIER_PRICES[tierKey]
  if (!prices) return null

  const annualSaving = (prices.monthly * 12 - prices.annual).toFixed(2)

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="font-medium text-primary-900">Save &pound;{annualSaving}/year with annual billing</p>
        <p className="text-sm text-primary-600">
          Switch your {TIER_LABELS[tier]} plan to annual and get 2 months free.
        </p>
      </div>
      <button
        onClick={handleManage}
        disabled={loading}
        className="shrink-0 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Switch to annual'}
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-primary-400 hover:text-primary-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
