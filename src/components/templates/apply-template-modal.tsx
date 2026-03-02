'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { applyTemplate } from '@/app/(dashboard)/templates/actions'
import { useToast } from '@/hooks/use-toast'
import type { Worksheet, WorkspaceTemplate } from '@/types/database'

type Step = 'select' | 'confirm' | 'result'

interface ApplyTemplateModalProps {
  open: boolean
  onClose: () => void
  relationshipId: string
  clientLabel: string
  templates: WorkspaceTemplate[]
  worksheets: Worksheet[]
  appUrl: string
  portalUrl?: string
}

export function ApplyTemplateModal({
  open,
  onClose,
  relationshipId,
  clientLabel,
  templates,
  worksheets,
  appUrl,
  portalUrl: existingPortalUrl,
}: ApplyTemplateModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    assignments: number
    resources: number
    skipped: number
    portalToken: string | null
  } | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const { toast } = useToast()

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep('select')
      setSelectedId(null)
      setError(null)
      setResult(null)
      triggerRef.current = document.activeElement
      setTimeout(() => {
        modalRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus()
      }, 0)
    } else {
      // Restore focus
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
    }
  }, [open])

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return

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
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const getWorksheetTitle = (id: string) =>
    worksheets.find((w) => w.id === id)?.title || null

  const handleApply = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)

    const res = await applyTemplate(selectedId, relationshipId)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setResult({
        assignments: res.created!.assignments,
        resources: res.created!.resources,
        skipped: res.skipped?.length || 0,
        portalToken: res.portalToken || null,
      })
      setStep('result')
    }
  }

  // Build final portal URL from returned token or existing prop
  const finalPortalUrl = result?.portalToken
    ? `${appUrl}/client/${result.portalToken}`
    : existingPortalUrl || null

  const qrUrl = finalPortalUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalPortalUrl)}&format=svg`
    : null

  const handleCopyPortalLink = async () => {
    if (!finalPortalUrl) return
    await navigator.clipboard.writeText(finalPortalUrl)
    toast({ type: 'success', message: 'Portal link copied to clipboard' })
  }

  const handleCopyMessage = async () => {
    if (!finalPortalUrl) return
    const msg = [
      `Hi,`,
      ``,
      `Your therapy workspace is ready. You can view your assignments, resources, and completed homework all in one place:`,
      finalPortalUrl,
      ``,
      `This link is private and does not require an account.`,
    ].join('\n')

    await navigator.clipboard.writeText(msg)
    toast({ type: 'success', message: 'Message copied to clipboard' })
  }

  const emailHref = finalPortalUrl
    ? `mailto:?subject=${encodeURIComponent('Your Therapy Workspace')}&body=${encodeURIComponent(`Hi,\n\nYour therapy workspace is ready. You can view your assignments, resources, and completed homework all in one place:\n${finalPortalUrl}\n\nThis link is private and does not require an account.`)}`
    : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Apply template"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-6 shadow-xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step 1: Select */}
        {step === 'select' && (
          <div>
            <h2 className="text-lg font-semibold text-primary-900 pr-8">Apply template</h2>
            <p className="mt-1 text-sm text-primary-500">
              Choose a template to apply to <span className="font-medium text-primary-700">{clientLabel}</span>.
            </p>

            {templates.length === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-primary-200 py-8 text-center">
                <p className="text-sm text-primary-500">No templates created yet.</p>
                <Link
                  href="/templates"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
                >
                  Create your first template
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selectedId === t.id
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                        : 'border-primary-100 hover:border-primary-200 hover:bg-primary-50/50'
                    }`}
                  >
                    <p className="font-medium text-primary-800">{t.name}</p>
                    {t.description && (
                      <p className="mt-0.5 text-xs text-primary-500 line-clamp-1">{t.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-primary-400">
                      <span>{t.assignment_specs.length} worksheet{t.assignment_specs.length !== 1 ? 's' : ''}</span>
                      <span>{t.resource_specs.length} resource{t.resource_specs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            {templates.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedId) {
                      setError(null)
                      setStep('confirm')
                    }
                  }}
                  disabled={!selectedId}
                  className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors disabled:opacity-50"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && selectedTemplate && (
          <div>
            <h2 className="text-lg font-semibold text-primary-900 pr-8">Confirm application</h2>
            <p className="mt-1 text-sm text-primary-500">
              The following will be created for <span className="font-medium text-primary-700">{clientLabel}</span>:
            </p>

            <div className="mt-4 space-y-4">
              {/* Worksheets */}
              {selectedTemplate.assignment_specs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-2">
                    Worksheets ({selectedTemplate.assignment_specs.length})
                  </h3>
                  <div className="space-y-1.5">
                    {selectedTemplate.assignment_specs.map((spec, idx) => {
                      const title = getWorksheetTitle(spec.worksheet_id)
                      return (
                        <div
                          key={`${spec.worksheet_id}-${idx}`}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                            title
                              ? 'bg-primary-50/50 text-primary-700'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                          }`}
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          {title || (
                            <span className="italic">Unavailable — will be skipped</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resources */}
              {selectedTemplate.resource_specs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-2">
                    Resources ({selectedTemplate.resource_specs.length})
                  </h3>
                  <div className="space-y-1.5">
                    {selectedTemplate.resource_specs.map((spec, idx) => (
                      <div
                        key={`${spec.url}-${idx}`}
                        className="flex items-center gap-2 rounded-lg bg-primary-50/50 px-3 py-2 text-sm text-primary-700"
                      >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                        </svg>
                        <span className="truncate">{spec.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleApply}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  'Applying…'
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Apply template
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setError(null)
                  setStep('select')
                }}
                disabled={loading}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-primary-900">Template applied</h2>
              <p className="mt-2 text-sm text-primary-500">
                {result.assignments > 0 && (
                  <span>Created {result.assignments} assignment{result.assignments !== 1 ? 's' : ''}</span>
                )}
                {result.assignments > 0 && result.resources > 0 && <span> and </span>}
                {result.resources > 0 && (
                  <span>shared {result.resources} resource{result.resources !== 1 ? 's' : ''}</span>
                )}
                <span> for {clientLabel}.</span>
              </p>

              {result.skipped > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  {result.skipped} worksheet{result.skipped !== 1 ? 's were' : ' was'} skipped because{' '}
                  {result.skipped !== 1 ? 'they are' : 'it is'} no longer available.
                </div>
              )}
            </div>

            {/* Share with client */}
            {finalPortalUrl && (
              <div className="mt-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-400">
                  Share with client
                </h3>

                {/* Portal link */}
                <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-mono text-primary-700">{finalPortalUrl}</p>
                    </div>
                    <button
                      onClick={handleCopyPortalLink}
                      className="shrink-0 rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
                    >
                      Copy link
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                {qrUrl && (
                  <div className="flex flex-col items-center rounded-xl border border-primary-100 bg-surface p-4">
                    <img
                      src={qrUrl}
                      alt="QR code for client portal"
                      width={140}
                      height={140}
                      className="max-w-full rounded-lg"
                    />
                    <p className="mt-2 text-xs text-primary-400">
                      Scan to open on a phone or tablet
                    </p>
                  </div>
                )}

                {/* Copy message + Send email */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                  >
                    <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    Copy message
                  </button>
                  {emailHref && (
                    <a
                      href={emailHref}
                      className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                    >
                      <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Send email
                    </a>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-primary-800 px-6 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
