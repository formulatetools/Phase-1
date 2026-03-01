'use client'

export type PortalTab = 'homework' | 'resources'
// Future: | 'measures'

interface PortalTabsProps {
  activeTab: PortalTab
  onTabChange: (tab: PortalTab) => void
  resourceCount: number
}

export function PortalTabs({ activeTab, onTabChange, resourceCount }: PortalTabsProps) {
  const tabs: { id: PortalTab; label: string; count?: number }[] = [
    { id: 'homework', label: 'Homework' },
    { id: 'resources', label: 'Resources', count: resourceCount },
  ]

  return (
    <div className="border-b border-primary-100">
      <nav className="-mb-px flex" aria-label="Portal tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 sm:flex-initial px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary-900'
                  : 'text-primary-400 hover:text-primary-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-brand/15 text-brand-dark'
                        : 'bg-primary-100 text-primary-400'
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
      </nav>
    </div>
  )
}
