'use client'

import { useState } from 'react'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      if (!res.ok) {
        setError('Could not open billing portal. Please try again.')
        setLoading(false)
        return
      }
      const { url } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        setError('Could not open billing portal. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark disabled:opacity-50 transition-colors"
      >
        {loading ? 'Loading...' : 'Manage subscription →'}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
