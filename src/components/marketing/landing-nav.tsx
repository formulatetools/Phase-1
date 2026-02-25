'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-primary-100 bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Logo size="md" />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="/worksheets"
            className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
          >
            Worksheets
          </Link>
          <Link
            href="/blog"
            className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
          >
            Blog
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="sm:hidden rounded-lg border border-primary-200 p-2 text-primary-500 hover:bg-primary-50 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-primary-100 bg-surface px-4 pb-4 sm:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <Link
              href="/worksheets"
              onClick={() => setOpen(false)}
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors py-1"
            >
              Worksheets
            </Link>
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors py-1"
            >
              Blog
            </Link>
            <Link
              href="#pricing"
              onClick={() => setOpen(false)}
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors py-1"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors py-1"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white text-center transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
