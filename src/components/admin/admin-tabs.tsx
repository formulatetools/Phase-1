'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Overview', href: '/admin' },
  { label: 'Revenue', href: '/admin/revenue' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Referrals', href: '/admin/referrals' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <div className="mb-8 border-b border-primary-100">
      <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide" aria-label="Admin tabs">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand text-brand-dark'
                  : 'border-transparent text-primary-400 hover:border-primary-200 hover:text-primary-600'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
