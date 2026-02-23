'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Shortcut {
  /** Key combo: 'Escape', 'mod+k', 'g d' (sequence), '?' */
  keys: string
  handler: () => void
  description: string
  scope?: string
}

/**
 * Registers global keyboard shortcuts.
 * - `mod+k` → Cmd on Mac, Ctrl on Windows/Linux
 * - `g d` → two-key sequence (press g, then d within 500ms)
 * - Shortcuts are disabled when focus is in an input, textarea, or select
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const sequenceRef = useRef<string | null>(null)
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Skip if inside form element
      const tag = (e.target as HTMLElement)?.tagName
      const editable = (e.target as HTMLElement)?.isContentEditable
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || editable) {
        // Allow Escape even in inputs
        if (e.key !== 'Escape') return
      }

      const isMod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      for (const shortcut of shortcuts) {
        const parts = shortcut.keys.toLowerCase().split('+')

        // Modifier combos: 'mod+k', 'mod+/'
        if (parts.includes('mod')) {
          const mainKey = parts.filter((p) => p !== 'mod')[0]
          if (isMod && key === mainKey) {
            e.preventDefault()
            shortcut.handler()
            return
          }
          continue
        }

        // Two-key sequences: 'g d'
        if (shortcut.keys.includes(' ')) {
          const [first, second] = shortcut.keys.toLowerCase().split(' ')
          if (sequenceRef.current === first && key === second) {
            e.preventDefault()
            sequenceRef.current = null
            if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
            shortcut.handler()
            return
          }
          continue
        }

        // Single key: '?', 'Escape', 'n'
        const singleKey = shortcut.keys.toLowerCase()
        if (key === singleKey && !isMod && !e.altKey) {
          // For '?' we need to check the actual key
          if (singleKey === '?' && e.key !== '?') continue
          e.preventDefault()
          shortcut.handler()
          return
        }
      }

      // Track sequence starts (single letters for g→d, g→w, etc.)
      if (!isMod && !e.altKey && key.length === 1) {
        sequenceRef.current = key
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
        sequenceTimerRef.current = setTimeout(() => {
          sequenceRef.current = null
        }, 500)
      }
    },
    [shortcuts],
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
    }
  }, [handler])
}
