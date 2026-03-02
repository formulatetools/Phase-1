'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ─── Types ─────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  href: string
  category: 'navigation' | 'action'
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

// ─── Icons (h-4 w-4 for palette) ──────────────────────────────────────────

const icons = {
  dashboard: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  clients: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  resources: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  myTools: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  templates: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM2.25 16.875c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-2.25z" />
    </svg>
  ),
  supervision: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  blog: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  ),
  featureRequests: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  settings: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  faq: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  referrals: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  sparkles: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
  plus: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  search: (
    <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
}

// ─── Command registry ──────────────────────────────────────────────────────

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: icons.dashboard, category: 'navigation', keywords: ['home', 'overview'] },
  { id: 'nav-clients', label: 'Clients', href: '/clients', icon: icons.clients, category: 'navigation', keywords: ['manage', 'caseload', 'patients'] },
  { id: 'nav-library', label: 'Library', href: '/worksheets', icon: icons.resources, category: 'navigation', keywords: ['resources', 'worksheets', 'browse', 'search'] },
  { id: 'nav-my-tools', label: 'My Tools', href: '/my-tools', icon: icons.myTools, category: 'navigation', keywords: ['custom', 'worksheets', 'builder'] },
  { id: 'nav-templates', label: 'Templates', href: '/templates', icon: icons.templates, category: 'navigation', keywords: ['onboarding', 'starter pack'] },
  { id: 'nav-supervision', label: 'Supervision', href: '/supervision', icon: icons.supervision, category: 'navigation', keywords: ['supervisee', 'training'] },
  { id: 'nav-blog', label: 'Blog', href: '/blog', icon: icons.blog, category: 'navigation', keywords: ['articles', 'read', 'clinical'] },
  { id: 'nav-feature-requests', label: 'Feature Requests', href: '/feature-requests', icon: icons.featureRequests, category: 'navigation', keywords: ['suggest', 'vote', 'ideas'] },
  { id: 'nav-settings', label: 'Settings', href: '/settings', icon: icons.settings, category: 'navigation', keywords: ['account', 'profile', 'subscription', 'billing'] },
  { id: 'nav-faq', label: 'FAQ', href: '/faq', icon: icons.faq, category: 'navigation', keywords: ['help', 'questions', 'support'] },
  { id: 'nav-referrals', label: 'Referrals', href: '/referrals', icon: icons.referrals, category: 'navigation', keywords: ['refer', 'invite', 'share', 'colleague'] },

  // Quick actions
  { id: 'act-ai-generate', label: 'Generate AI worksheet', description: 'Describe and let AI build it', href: '/my-tools/ai', icon: icons.sparkles, category: 'action', keywords: ['ai', 'create', 'generate', 'build'] },
  { id: 'act-new-tool', label: 'Create custom worksheet', description: 'Build from scratch', href: '/my-tools/new', icon: icons.plus, category: 'action', keywords: ['new', 'create', 'custom', 'builder'] },
  { id: 'act-browse', label: 'Browse library', description: 'Search the worksheet library', href: '/worksheets', icon: icons.resources, category: 'action', keywords: ['search', 'find', 'resources', 'browse'] },
]

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Go to',
  action: 'Quick actions',
}

// ─── Component ─────────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Close on route change
  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      // Focus input after render
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS
    const q = query.toLowerCase()
    return COMMANDS.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true
      if (item.description?.toLowerCase().includes(q)) return true
      if (item.keywords?.some((kw) => kw.includes(q))) return true
      return false
    })
  }, [query])

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: { category: string; label: string; items: CommandItem[] }[] = []
    const seen = new Set<string>()

    for (const item of filteredCommands) {
      if (!seen.has(item.category)) {
        seen.add(item.category)
        groups.push({
          category: item.category,
          label: CATEGORY_LABELS[item.category] || item.category,
          items: [],
        })
      }
      groups.find((g) => g.category === item.category)?.items.push(item)
    }
    return groups
  }, [filteredCommands])

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Execute selected command
  const executeItem = useCallback(
    (item: CommandItem) => {
      router.push(item.href)
      onClose()
    },
    [router, onClose],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = filteredCommands.length
      if (total === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % total)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + total) % total)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = filteredCommands[selectedIndex]
        if (item) executeItem(item)
      }
    },
    [filteredCommands, selectedIndex, executeItem],
  )

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  let globalIndex = -1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg animate-fade-in rounded-2xl border border-primary-100 bg-surface shadow-xl overflow-hidden dark:border-primary-800"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-primary-100 px-4 py-3 dark:border-primary-800">
          {icons.search}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to..."
            className="flex-1 bg-transparent text-sm text-primary-800 placeholder:text-primary-400 outline-none dark:text-primary-100 dark:placeholder:text-primary-500"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-400 dark:border-primary-700 dark:bg-primary-800 dark:text-primary-500">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {groupedCommands.map((group) => (
            <div key={group.category}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-400 dark:text-primary-500">
                {group.label}
              </p>
              {group.items.map((item) => {
                globalIndex++
                const idx = globalIndex
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-brand/10 text-brand-dark dark:bg-brand/15 dark:text-brand'
                        : 'text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-800'
                    }`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className={isSelected ? 'text-brand' : 'text-primary-400 dark:text-primary-500'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.description && (
                      <span className="truncate text-xs text-primary-400 dark:text-primary-500">
                        {item.description}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {/* Empty state */}
          {filteredCommands.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-primary-400 dark:text-primary-500">
              No results found
            </p>
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-primary-100 px-4 py-2 flex items-center gap-4 text-[10px] text-primary-400 dark:border-primary-800 dark:text-primary-500">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-primary-200 bg-primary-50 px-1 py-px text-[9px] font-semibold dark:border-primary-700 dark:bg-primary-800">&uarr;&darr;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-primary-200 bg-primary-50 px-1 py-px text-[9px] font-semibold dark:border-primary-700 dark:bg-primary-800">&crarr;</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-primary-200 bg-primary-50 px-1 py-px text-[9px] font-semibold dark:border-primary-700 dark:bg-primary-800">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
