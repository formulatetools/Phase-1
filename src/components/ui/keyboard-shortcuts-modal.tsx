'use client'

import { useEffect, useRef } from 'react'

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  {
    scope: 'Navigation',
    items: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'W'], description: 'Go to Resources' },
      { keys: ['G', 'C'], description: 'Go to Clients' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    scope: 'Actions',
    items: [
      { keys: [modKey, 'K'], description: 'Search resources' },
      { keys: ['?'], description: 'Open this reference' },
      { keys: ['Esc'], description: 'Close modal' },
    ],
  },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-primary-200 bg-primary-50 px-1.5 text-[11px] font-semibold text-primary-600">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)

  // Focus trap + Escape key
  useEffect(() => {
    if (!open) return

    triggerRef.current = document.activeElement

    const timer = setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, 0)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close keyboard shortcuts"
          className="absolute right-3 top-3 rounded-lg p-2.5 text-primary-400 hover:bg-primary-50 hover:text-primary-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="shortcuts-title" className="mb-1 text-lg font-bold text-primary-900">Keyboard Shortcuts</h2>
        <p className="mb-5 text-sm text-primary-400">
          Navigate quickly with these shortcuts
        </p>

        {shortcuts.map((group) => (
          <div key={group.scope} className="mb-5 last:mb-0">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-400">
              {group.scope}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={item.description}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5"
                >
                  <span className="text-sm text-primary-700">{item.description}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((key, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-xs text-primary-300">then</span>}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
