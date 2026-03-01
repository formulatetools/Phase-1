import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <Link href="/" aria-label="Go to homepage">
        <Logo size="md" />
      </Link>

      {/* 404 number */}
      <p className="mt-10 text-8xl font-bold tracking-tight text-brand sm:text-9xl">
        404
      </p>

      {/* Message */}
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-primary-400">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-900"
        >
          Back to Home
        </Link>
        <Link
          href="/worksheets"
          className="inline-flex items-center justify-center rounded-lg border border-primary-200 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary-50"
        >
          Browse Resources
        </Link>
      </div>

      {/* Footer hint */}
      <p className="mt-16 text-xs text-primary-300">
        If you think this is an error, please refresh the page or{' '}
        <Link href="/" className="text-brand underline underline-offset-2 hover:text-brand-dark">
          go back home
        </Link>
        .
      </p>
    </div>
  )
}
