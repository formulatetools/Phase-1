'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  homeworkUrl: string
  worksheetTitle: string
  clientLabel: string
  dueDate?: string
}

export function ShareModal({
  open,
  onClose,
  homeworkUrl,
  worksheetTitle,
  clientLabel,
  dueDate,
}: ShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)

  // Generate QR code using Canvas API (no external dependency)
  useEffect(() => {
    if (!open || !homeworkUrl) return

    // Use a simple QR code generation via a public API
    // We render it as an image from a free QR API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(homeworkUrl)}&format=svg`
    setQrDataUrl(qrUrl)
  }, [open, homeworkUrl])

  // Focus trap + Escape key
  useEffect(() => {
    if (!open) return

    // Remember the element that opened the modal
    triggerRef.current = document.activeElement

    // Move focus into the modal
    const timer = setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus()
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
      // Return focus to trigger
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
  }, [open, onClose])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(homeworkUrl)
    toast({ type: 'success', message: 'Link copied to clipboard' })
  }

  const handleCopyMessage = async () => {
    const msg = [
      `Hi,`,
      ``,
      `Your therapist has assigned you a worksheet: "${worksheetTitle}".`,
      dueDate ? `It's due by ${new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.` : '',
      ``,
      `You can complete it here:`,
      homeworkUrl,
      ``,
      `This link is private and does not require an account.`,
    ]
      .filter(Boolean)
      .join('\n')

    await navigator.clipboard.writeText(msg)
    toast({ type: 'success', message: 'Message copied to clipboard' })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="share-title" className="relative w-full max-w-md rounded-2xl border border-primary-100 bg-surface p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close assignment modal"
          className="absolute right-3 top-3 rounded-lg p-2.5 text-primary-400 hover:bg-primary-50 hover:text-primary-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 id="share-title" className="mt-3 text-lg font-bold text-primary-900">Homework assigned!</h2>
          <p className="mt-1 text-sm text-primary-500">
            <strong>{worksheetTitle}</strong> has been assigned to <strong>{clientLabel}</strong>.
            Share the link below so they can complete it.
          </p>
        </div>

        {/* URL field */}
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-mono text-primary-700">{homeworkUrl}</p>
            </div>
            <Button
              onClick={handleCopy}
              size="sm"
              className="shrink-0"
            >
              Copy link
            </Button>
          </div>
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-primary-100 bg-surface p-4">
            <img
              src={qrDataUrl}
              alt="QR code for homework link"
              width={140}
              height={140}
              className="rounded-lg"
            />
            <p className="mt-2 text-xs text-primary-400">
              Scan to open on a phone or tablet
            </p>
          </div>
        )}

        {/* Share options */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyMessage}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Copy message
          </button>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Homework: ${worksheetTitle}`)}&body=${encodeURIComponent(`Hi,\n\nYour therapist has assigned you a worksheet: "${worksheetTitle}".\n\nYou can complete it here:\n${homeworkUrl}\n\nThis link is private and does not require an account.`)}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Send email
          </a>
        </div>

        {/* Done button */}
        <Button
          onClick={onClose}
          className="mt-4 w-full"
        >
          Done
        </Button>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
