'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal'
import { CommandPalette } from '@/components/ui/command-palette'

interface KeyboardShortcutsContextValue {
  openShortcutsModal: () => void
  openCommandPalette: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue>({
  openShortcutsModal: () => {},
  openCommandPalette: () => {},
})

export const useShortcutsModal = () => useContext(KeyboardShortcutsContext)

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const openShortcutsModal = useCallback(() => setModalOpen(true), [])
  const closeShortcutsModal = useCallback(() => setModalOpen(false), [])
  const openCommandPalette = useCallback(() => setPaletteOpen(true), [])
  const closeCommandPalette = useCallback(() => setPaletteOpen(false), [])

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
        handler: () => {
          // Close whichever modal is open (palette takes priority)
          if (paletteOpen) {
            setPaletteOpen(false)
          } else {
            setModalOpen(false)
          }
        },
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
        description: 'Go to Resources',
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
        handler: () => setPaletteOpen((o) => !o),
        description: 'Command palette',
        scope: 'Actions',
      },
    ],
    [router, paletteOpen],
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <KeyboardShortcutsContext.Provider value={{ openShortcutsModal, openCommandPalette }}>
      {children}
      <KeyboardShortcutsModal open={modalOpen} onClose={closeShortcutsModal} />
      <CommandPalette open={paletteOpen} onClose={closeCommandPalette} />
    </KeyboardShortcutsContext.Provider>
  )
}
