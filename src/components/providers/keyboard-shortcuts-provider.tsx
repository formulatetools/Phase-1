'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal'

interface KeyboardShortcutsContextValue {
  openShortcutsModal: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue>({
  openShortcutsModal: () => {},
})

export const useShortcutsModal = () => useContext(KeyboardShortcutsContext)

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const openShortcutsModal = useCallback(() => setModalOpen(true), [])
  const closeShortcutsModal = useCallback(() => setModalOpen(false), [])

  const shortcuts = useMemo(
    () => [
      {
        keys: '?',
        handler: () => setModalOpen((o) => !o),
        description: 'Open keyboard shortcuts',
        scope: 'Global',
      },
      {
        keys: 'mod+/',
        handler: () => setModalOpen((o) => !o),
        description: 'Open keyboard shortcuts',
        scope: 'Global',
      },
      {
        keys: 'Escape',
        handler: () => setModalOpen(false),
        description: 'Close modal',
        scope: 'Global',
      },
      {
        keys: 'g d',
        handler: () => router.push('/dashboard'),
        description: 'Go to Dashboard',
        scope: 'Navigation',
      },
      {
        keys: 'g w',
        handler: () => router.push('/worksheets'),
        description: 'Go to Worksheets',
        scope: 'Navigation',
      },
      {
        keys: 'g c',
        handler: () => router.push('/clients'),
        description: 'Go to Clients',
        scope: 'Navigation',
      },
      {
        keys: 'g s',
        handler: () => router.push('/settings'),
        description: 'Go to Settings',
        scope: 'Navigation',
      },
      {
        keys: 'mod+k',
        handler: () => {
          // Focus the search input on worksheets page
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')
          if (searchInput) {
            searchInput.focus()
          } else {
            router.push('/worksheets')
          }
        },
        description: 'Search worksheets',
        scope: 'Actions',
      },
    ],
    [router],
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <KeyboardShortcutsContext.Provider value={{ openShortcutsModal }}>
      {children}
      <KeyboardShortcutsModal open={modalOpen} onClose={closeShortcutsModal} />
    </KeyboardShortcutsContext.Provider>
  )
}
