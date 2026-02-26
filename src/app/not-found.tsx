import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <LogoIcon size={48} />
      <p className="mt-6 text-6xl font-bold text-primary-200">404</p>
      <h1 className="mt-2 text-xl font-bold text-primary-900">Page not found</h1>
      <p className="mt-2 max-w-md text-center text-sm text-primary-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors"
        >
          Home
        </Link>
        <Link
          href="/worksheets"
          className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
        >
          Browse Worksheets
        </Link>
      </div>
    </div>
  )
}
