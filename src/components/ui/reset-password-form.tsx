'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Check if the user has a valid session (from the callback code exchange)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  // Still checking session
  if (hasSession === null) {
    return (
      <p className="text-sm text-primary-400">Loading...</p>
    )
  }

  // No session — user likely navigated here directly
  if (!hasSession) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Invalid or expired reset link. Please request a new one.
        </div>
        <Link
          href="/forgot-password"
          className="block text-center text-sm font-medium text-primary-800 underline underline-offset-2 hover:text-primary-900"
        >
          Request a new reset link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-brand-light px-3 py-2 text-sm text-brand-text">
          Your password has been updated successfully.
        </div>
        <Link href="/dashboard">
          <Button size="lg" className="w-full">
            Continue to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-primary-700"
        >
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          placeholder="Minimum 8 characters"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-primary-700"
        >
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          placeholder="Re-enter your password"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  )
}
