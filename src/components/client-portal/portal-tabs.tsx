'use client'

import { useCallback } from 'react'

export type PortalTab = 'homework' | 'resources'
// Future: | 'measures'

interface PortalTabsProps {
  activeTab: PortalTab
  onTabChange: (tab: PortalTab) => void
  resourceCount: number
}

const TAB_ORDER: PortalTab[] = ['homework', 'resources']

export function PortalTabs({ activeTab, onTabChange, resourceCount }: PortalTabsProps) {
  const tabs: { id: PortalTab; label: string; count?: number }[] = [
    { id: 'homework', label: 'Homework' },
    { id: 'resources', label: 'Resources', count: resourceCount },
  ]

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    let nextIndex = -1

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % TAB_ORDER.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = TAB_ORDER.length - 1
    }

    if (nextIndex >= 0) {
      onTabChange(TAB_ORDER[nextIndex])
      // Focus the newly active tab button
      const btn = document.getElementById(`portal-tab-${TAB_ORDER[nextIndex]}`)
      btn?.focus()
    }
  }, [activeTab, onTabChange])

  return (
    <div className="border-b border-primary-100">
      <div className="-mb-px flex" role="tablist" aria-label="Portal sections" onKeyDown={handleKeyDown}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`portal-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`portal-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`relative flex-1 sm:flex-initial px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset rounded-t-lg ${
                isActive
                  ? 'text-primary-900'
                  : 'text-primary-400 hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-brand/15 text-brand-dark'
                        : 'bg-primary-100 text-primary-400 dark:text-primary-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {/* Active indicator */}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
