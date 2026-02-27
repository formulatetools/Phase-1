'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DISMISS_KEY = 'formulate_checklist_dismissed'

interface ChecklistStatus {
  browsedWorksheets: boolean
  addedClient: boolean
  assignedHomework: boolean
  exportedWorksheet: boolean
}

interface OnboardingChecklistProps {
  status: ChecklistStatus
}

const steps = [
  {
    key: 'browsedWorksheets' as const,
    title: 'Explore the worksheet library',
    description:
      'Browse evidence-based CBT worksheets organised by therapeutic domain — anxiety, depression, OCD, trauma, and more. Find the right tool for your client.',
    cta: 'Browse worksheets',
    href: '/worksheets',
  },
  {
    key: 'addedClient' as const,
    title: 'Add your first client',
    description:
      'Use a non-identifiable label (e.g. "Client A" or initials). Formulate never stores real names — all homework is shared via anonymous links, keeping your practice GDPR-compliant.',
    cta: 'Add a client',
    href: '/clients',
  },
  {
    key: 'assignedHomework' as const,
    title: 'Assign your first homework',
    description:
      'Choose a worksheet, assign it to your client, and share the secure link. They complete it in their browser at their own pace — you review their responses before the next session.',
    cta: 'Assign homework',
    href: '/clients',
  },
]

export function OnboardingChecklist({ status }: OnboardingChecklistProps) {
  const [visible, setVisible] = useState(false)

  const completedCount = steps.filter((s) => status[s.key]).length
  const allDone = completedCount === steps.length

  // The current step is the first incomplete step
  const currentStepIndex = steps.findIndex((s) => !status[s.key])

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed && !allDone) {
      setVisible(true)
    }
  }, [allDone])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-6 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light to-white dark:to-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary-900">
            Get started in 3 steps
          </h3>
          <p className="mt-0.5 text-xs text-primary-400">
            Set up your first homework assignment
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-primary-400 transition-colors hover:bg-primary-100 hover:text-primary-600"
          aria-label="Dismiss checklist"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-100">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-primary-400">
          {completedCount} of {steps.length}
        </span>
      </div>

      {/* Funnel steps */}
      <div className="mt-5 space-y-2">
        {steps.map((step, index) => {
          const done = status[step.key]
          const isCurrent = index === currentStepIndex

          return (
            <div
              key={step.key}
              className={`rounded-xl border transition-all ${
                done
                  ? 'border-green-100 bg-green-50/50'
                  : isCurrent
                  ? 'border-brand/30 bg-surface shadow-sm'
                  : 'border-primary-100 bg-primary-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Step indicator */}
                {done ? (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-brand text-primary-900'
                        : 'bg-primary-200 text-primary-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      done ? 'text-green-700' : 'text-primary-900'
                    }`}
                  >
                    {step.title}
                  </p>

                  {/* Expanded description + CTA for current step only */}
                  {isCurrent && !done && (
                    <>
                      <p className="mt-1.5 text-xs leading-relaxed text-primary-500">
                        {step.description}
                      </p>
                      <Link
                        href={step.href}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900"
                      >
                        {step.cta}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tour + Dismiss links */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('formulate:start-tour'))}
          className="flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Take a tour
        </button>
        <button
          onClick={handleDismiss}
          className="text-xs text-primary-400 transition-colors hover:text-primary-600"
        >
          Hide checklist
        </button>
      </div>
    </div>
  )
}
