'use client'

import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md rounded-2xl border border-primary-100 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-primary-900">Admin panel error</h2>
        <p className="mt-2 text-sm text-primary-500">
          Something went wrong loading this admin page.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
          >
            Admin home
          </Link>
        </div>
      </div>
    </div>
  )
}
