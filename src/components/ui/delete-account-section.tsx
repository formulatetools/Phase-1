'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/app/(dashboard)/settings/actions'

export function DeleteAccountSection() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
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
    <div className="rounded-2xl border border-red-100 bg-surface p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-primary-900">Delete Account</h2>
      <p className="mb-5 text-sm text-primary-400">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <div>
            <p className="text-sm font-medium text-red-800">
              This will permanently delete:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              <li>All your clients and their assignment data</li>
              <li>All worksheet responses and submissions</li>
              <li>Your custom worksheets and bookmarks</li>
              <li>Your subscription and account profile</li>
            </ul>
          </div>

          <div>
            <label htmlFor="delete-confirm" className="block text-sm font-medium text-red-800 mb-1">
              Type <span className="font-bold">delete my account</span> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowConfirm(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={loading}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'delete my account' || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Permanently delete account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
