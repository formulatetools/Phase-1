'use client'

import { useRouter } from 'next/navigation'

interface ClientsTabBarProps {
  clientCount: number
  superviseeCount: number
  activeTab: 'clients' | 'supervisees'
  showSupervisees: boolean
}

export function ClientsTabBar({
  clientCount,
  superviseeCount,
  activeTab,
  showSupervisees,
}: ClientsTabBarProps) {
  const router = useRouter()

  if (!showSupervisees) return null

  return (
    <div className="mb-6 inline-flex rounded-lg bg-primary-100 p-1 dark:bg-primary-800" role="tablist" aria-label="Client views">
      <button
        role="tab"
        aria-selected={activeTab === 'clients'}
        onClick={() => router.push('/clients')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          activeTab === 'clients'
            ? 'bg-surface text-primary-900 shadow-sm dark:bg-primary-700 dark:text-primary-50'
            : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200'
        }`}
      >
        Clients ({clientCount})
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'supervisees'}
        onClick={() => router.push('/clients?tab=supervisees')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          activeTab === 'supervisees'
            ? 'bg-surface text-primary-900 shadow-sm dark:bg-primary-700 dark:text-primary-50'
            : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200'
        }`}
      >
        Supervisees ({superviseeCount})
      </button>
    </div>
  )
}
