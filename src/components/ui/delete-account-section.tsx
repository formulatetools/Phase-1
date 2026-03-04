'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/app/(dashboard)/settings/actions'

const CONFIRMATION_PHRASE = 'delete my account'

export function DeleteAccountSection() {
  const [expanded, setExpanded] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isConfirmed = confirmation.toLowerCase().trim() === CONFIRMATION_PHRASE

  const handleDelete = async () => {
    if (!isConfirmed) return
    setLoading(true)
    setError(null)

    const result = await deleteAccount()

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Sign out and redirect
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-surface p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-red-700 dark:text-red-400">
        Delete account
      </h2>
      <p className="text-sm text-primary-500">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!expanded ? (
        <button
          onClick={() => {
            setExpanded(true)
            setTimeout(() => inputRef.current?.focus(), 100)
          }}
          className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          I want to delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 space-y-2">
            <p className="font-medium">This will permanently delete:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>All your clients and their homework data</li>
              <li>All worksheet assignments and responses</li>
              <li>Your custom worksheets and homework plans</li>
              <li>Shared resources and queue data</li>
              <li>Your subscription (if active, it will be cancelled)</li>
              <li>Your profile and all account settings</li>
            </ul>
          </div>

          <div>
            <label htmlFor="delete-confirm" className="block text-sm font-medium text-primary-700 dark:text-primary-300">
              Type <span className="font-mono text-red-600 dark:text-red-400">{CONFIRMATION_PHRASE}</span> to confirm
            </label>
            <input
              ref={inputRef}
              id="delete-confirm"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={loading}
              placeholder={CONFIRMATION_PHRASE}
              autoComplete="off"
              className="mt-1.5 block w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 dark:border-primary-700 dark:text-primary-100 dark:placeholder:text-primary-600"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? 'Deleting account…' : 'Permanently delete my account'}
            </button>
            <button
              onClick={() => {
                setExpanded(false)
                setConfirmation('')
                setError(null)
              }}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm text-primary-500 transition-colors hover:bg-primary-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
