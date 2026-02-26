'use client'

import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <LogoIcon size={48} />
      <h2 className="mt-6 text-xl font-bold text-primary-900">Something went wrong</h2>
      <p className="mt-2 max-w-md text-center text-sm text-primary-500">
        An unexpected error occurred. Please try again or return to the home page.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  )
}
