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

const items = [
  {
    key: 'browsedWorksheets' as const,
    label: 'Browse the worksheet library',
    href: '/worksheets',
  },
  {
    key: 'addedClient' as const,
    label: 'Add your first client',
    href: '/clients',
  },
  {
    key: 'assignedHomework' as const,
    label: 'Assign a worksheet as homework',
    href: '/clients',
  },
  {
    key: 'exportedWorksheet' as const,
    label: 'Export or print a worksheet',
    href: '/worksheets',
  },
]

export function OnboardingChecklist({ status }: OnboardingChecklistProps) {
  const [visible, setVisible] = useState(false)

  const completed = items.filter((item) => status[item.key]).length
  const allDone = completed === items.length

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
    <div className="mb-6 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light to-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-900">Getting Started</h3>
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
            style={{ width: `${(completed / items.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-primary-400">
          {completed} of {items.length}
        </span>
      </div>

      {/* Checklist items */}
      <div className="mt-4 space-y-1">
        {items.map((item) => {
          const done = status[item.key]
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                done
                  ? 'text-primary-400'
                  : 'text-primary-700 hover:bg-white/60'
              }`}
            >
              {/* Check / circle icon */}
              {done ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-primary-200" />
              )}

              {/* Label */}
              <span className={done ? 'line-through' : ''}>
                {item.label}
              </span>

              {/* Arrow for incomplete items */}
              {!done && (
                <svg className="ml-auto h-3.5 w-3.5 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </Link>
          )
        })}
      </div>

      {/* Dismiss link */}
      <div className="mt-3 flex justify-end">
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
