import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'

export function MarketingFooter() {
  return (
    <footer className="border-t border-primary-100 bg-surface py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-3">
              <LogoIcon size={18} />
              <p className="text-sm text-primary-400">
                &copy; {new Date().getFullYear()} Formulate Tools Ltd. All rights reserved.
              </p>
            </div>
            <p className="text-xs text-primary-300">
              Company No. 17065550 · Registered in England &amp; Wales · 11 Chantry Close, TW16 7TH
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-400">
            <Link href="/worksheets" className="hover:text-primary-600 transition-colors">
              Resources
            </Link>
            <Link href="/blog" className="hover:text-primary-600 transition-colors">
              Blog
            </Link>
            <Link href="/pricing" className="hover:text-primary-600 transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-primary-600 transition-colors">
              FAQ
            </Link>
            <Link href="/security" className="hover:text-primary-600 transition-colors">
              Security
            </Link>
            <Link href="/feature-requests" className="hover:text-primary-600 transition-colors">
              Feature Requests
            </Link>
            <Link href="/privacy" className="hover:text-primary-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary-600 transition-colors">
              Terms
            </Link>
            <Link href="/login" className="hover:text-primary-600 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
