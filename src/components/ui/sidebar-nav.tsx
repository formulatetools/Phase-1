'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Logo } from '@/components/ui/logo'
import { ThemeToggle, ThemeToggleCompact } from '@/components/ui/theme-toggle'
import { useShortcutsModal } from '@/components/providers/keyboard-shortcuts-provider'
import { buttonVariants } from '@/components/ui/button'

interface SidebarNavProps {
  userEmail: string
  userName: string | null
  tier: string
  role?: string
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: 'Resources',
    href: '/worksheets',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    label: 'My Tools',
    href: '/my-tools',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    label: 'AI Generate',
    href: '/my-tools/ai',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    label: 'Supervision',
    href: '/supervision',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    label: 'Blog',
    href: '/blog',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
      </svg>
    ),
  },
  {
    label: 'Referrals',
    href: '/referrals',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: 'Feature Requests',
    href: '/feature-requests',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

// Bottom tab bar: 5 primary routes + "More" button
const TAB_SHORT_LABELS: Record<string, string> = {
  '/dashboard': 'Home',
  '/clients': 'Clients',
  '/worksheets': 'Library',
  '/my-tools': 'Tools',
  '/my-tools/ai': 'AI',
}
const TAB_HREFS = new Set(Object.keys(TAB_SHORT_LABELS))

export function SidebarNav({ userEmail, userName, tier, role }: SidebarNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { openShortcutsModal } = useShortcutsModal()

  // Build nav items — conditionally add Admin for admin users
  const allNavItems = role === 'admin'
    ? [
        ...navItems,
        {
          label: 'Admin',
          href: '/admin',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          ),
        },
      ]
    : navItems

  // Split items: bottom tabs vs "More" sheet
  const tabItems = allNavItems.filter(i => TAB_HREFS.has(i.href))
  const moreNavItems = allNavItems.filter(i => !TAB_HREFS.has(i.href))

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    // Exact match for /my-tools/ai so it doesn't also highlight /my-tools
    if (href === '/my-tools/ai') return pathname === '/my-tools/ai'
    // /my-tools should match /my-tools and sub-pages but not /my-tools/ai
    if (href === '/my-tools') return pathname.startsWith('/my-tools') && pathname !== '/my-tools/ai'
    return pathname.startsWith(href)
  }

  // Is current page one of the "More" items?
  const isMoreActive = moreNavItems.some(item => isActive(item.href))

  // Close more sheet on navigation
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  // Swipe down to close more sheet
  const touchStartY = useRef(0)
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])
  const handleSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current
    if (diff > 60) setMoreOpen(false)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const tierColors: Record<string, string> = {
    free: 'bg-primary-100 text-primary-600',
    starter: 'bg-brand/10 text-brand-dark',
    standard: 'bg-brand/10 text-brand-dark',
    professional: 'bg-brand/10 text-brand-dark',
  }

  const tierLabels: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    standard: 'Practice',
    professional: 'Specialist',
  }

  // Desktop sidebar content (unchanged)
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
      </div>

      {/* Upgrade prompt — free tier only */}
      {tier === 'free' && (
        <div className="px-3 pb-1">
          <Link
            href="/pricing"
            className={`${buttonVariants.accent('sm')} w-full`}
          >
            <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            Upgrade
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" data-tour="sidebar-nav">
        {allNavItems.map((item) => {
          const tourId =
            item.label === 'Resources' ? 'nav-worksheets'
            : item.label === 'Clients' ? 'nav-clients'
            : item.label === 'Settings' ? 'nav-settings'
            : undefined
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={tourId}
              className={`flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors ${
                isActive(item.href)
                  ? 'border-l-[3px] border-brand bg-brand/10 pl-[calc(0.75rem-3px)] pr-3 font-semibold text-brand-dark'
                  : 'border-l-[3px] border-transparent pl-[calc(0.75rem-3px)] pr-3 font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              <span className={isActive(item.href) ? 'text-brand' : ''}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Legal links */}
      <div className="px-3 pb-2 flex gap-3">
        <Link href="/privacy" className="text-[11px] text-primary-400 hover:text-primary-600 transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="text-[11px] text-primary-400 hover:text-primary-600 transition-colors">
          Terms
        </Link>
      </div>

      {/* User section */}
      <div className="border-t border-primary-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
            {(userName || userEmail).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-primary-800">
              {userName || 'User'}
            </p>
            <p className="truncate text-xs text-primary-400">{userEmail}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierColors[tier] || tierColors.free}`}>
            {tierLabels[tier] || tier}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={openShortcutsModal}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
            title="Keyboard shortcuts (?)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header — logo + theme toggle + upgrade, no hamburger */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-primary-100 bg-surface px-4 md:hidden">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggleCompact />
          {tier === 'free' && (
            <Link
              href="/pricing"
              className={`${buttonVariants.accent('sm')} rounded-full`}
            >
              <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Desktop sidebar — unchanged */}
      <aside data-sidebar-nav className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:w-64 md:flex-col md:border-r md:border-primary-100 md:bg-surface">
        {sidebarContent}
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-primary-100 bg-surface md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex">
          {tabItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium transition-colors ${
                  active
                    ? 'text-primary-800'
                    : 'text-primary-400 active:text-primary-600'
                }`}
              >
                <span className={active ? 'text-brand' : ''}>{item.icon}</span>
                {TAB_SHORT_LABELS[item.href]}
              </Link>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            aria-expanded={moreOpen}
            aria-label="Additional navigation menu"
            className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium transition-colors ${
              moreOpen || isMoreActive
                ? 'text-primary-800'
                : 'text-primary-400 active:text-primary-600'
            }`}
          >
            <span className={moreOpen || isMoreActive ? 'text-brand' : ''}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </span>
            More
          </button>
        </div>
      </nav>

      {/* ── More sheet backdrop ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* ── More slide-up sheet ── */}
      <div
        onTouchStart={handleSheetTouchStart}
        onTouchEnd={handleSheetTouchEnd}
        role="dialog"
        aria-modal={moreOpen}
        aria-label="Additional navigation menu"
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface shadow-xl transition-transform duration-200 md:hidden ${
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center rounded-t-2xl bg-surface py-3">
          <div className="h-1 w-8 rounded-full bg-primary-200" />
        </div>

        {/* Nav items */}
        <nav className="px-4 pb-2 space-y-0.5">
          {moreNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                  active
                    ? 'bg-brand/10 font-semibold text-brand-dark'
                    : 'text-primary-600 active:bg-primary-50'
                }`}
              >
                <span className={active ? 'text-brand' : ''}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-primary-100" />

        {/* User section */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
              {(userName || userEmail).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-primary-800">
                {userName || 'User'}
              </p>
              <p className="truncate text-xs text-primary-400">{userEmail}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierColors[tier] || tierColors.free}`}>
              {tierLabels[tier] || tier}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={openShortcutsModal}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
              title="Keyboard shortcuts (?)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
