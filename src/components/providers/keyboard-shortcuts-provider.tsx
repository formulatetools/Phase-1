'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal'
import { CommandPalette, type CommandItem } from '@/components/ui/command-palette'
import { useAssign } from '@/components/providers/assign-provider'

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
  const { openAssignModal } = useAssign()
  const [modalOpen, setModalOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const openShortcutsModal = useCallback(() => setModalOpen(true), [])
  const closeShortcutsModal = useCallback(() => setModalOpen(false), [])
  const openCommandPalette = useCallback(() => setPaletteOpen(true), [])
  const closeCommandPalette = useCallback(() => setPaletteOpen(false), [])

  // Extra commands injected into the command palette
  const extraCommands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'act-assign',
        label: 'Assign worksheet',
        description: 'Assign homework to a client',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        ),
        action: () => openAssignModal(),
        category: 'action',
        keywords: ['assign', 'homework', 'send', 'client'],
      },
    ],
    [openAssignModal],
  )

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
        description: 'Go to Library',
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
      {
        keys: 'a w',
        handler: () => openAssignModal(),
        description: 'Assign worksheet',
        scope: 'Actions',
      },
    ],
    [router, paletteOpen, openAssignModal],
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <KeyboardShortcutsContext.Provider value={{ openShortcutsModal, openCommandPalette }}>
      {children}
      <KeyboardShortcutsModal open={modalOpen} onClose={closeShortcutsModal} />
      <CommandPalette open={paletteOpen} onClose={closeCommandPalette} extraCommands={extraCommands} />
    </KeyboardShortcutsContext.Provider>
  )
}
