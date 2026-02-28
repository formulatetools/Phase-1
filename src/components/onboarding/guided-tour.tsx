'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface TourStep {
  target: string        // data-tour attribute value
  title: string
  description: string
  position: 'right' | 'bottom'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar-nav',
    title: 'Your Navigation',
    description: 'Access all areas of Formulate from this sidebar. On mobile, tap the menu icon to open it.',
    position: 'right',
  },
  {
    target: 'nav-worksheets',
    title: 'Resource Library',
    description: 'Browse evidence-based CBT resources organised by therapeutic domain. Search, filter, and preview.',
    position: 'right',
  },
  {
    target: 'nav-clients',
    title: 'Client Management',
    description: 'Add clients using non-identifiable labels, assign homework, and track completion — all GDPR-compliant.',
    position: 'right',
  },
  {
    target: 'nav-settings',
    title: 'Your Settings',
    description: 'Manage your profile, subscription, and preferences here. You can also change the theme.',
    position: 'right',
  },
]

interface GuidedTourProps {
  active: boolean
  step: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onComplete: () => void
}

export function GuidedTour({ active, step, onNext, onPrev, onSkip, onComplete }: GuidedTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const isFirst = step === 0

  const updateTargetRect = useCallback(() => {
    if (!currentStep) return
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Small delay for scroll to complete
      setTimeout(() => {
        setTargetRect(el.getBoundingClientRect())
      }, 100)
    }
  }, [currentStep])

  useEffect(() => {
    if (!active) return
    updateTargetRect()

    window.addEventListener('resize', updateTargetRect)
    return () => window.removeEventListener('resize', updateTargetRect)
  }, [active, step, updateTargetRect])

  if (!active || !currentStep || !targetRect) return null

  // Calculate tooltip position
  const padding = 8
  const tooltipStyle: React.CSSProperties = {}

  if (currentStep.position === 'right') {
    tooltipStyle.top = targetRect.top
    tooltipStyle.left = targetRect.right + padding + 12
  } else {
    tooltipStyle.top = targetRect.bottom + padding + 12
    tooltipStyle.left = targetRect.left
  }

  // Clip-path for spotlight cut-out
  const inset = 4
  const rx = targetRect.x - inset
  const ry = targetRect.y - inset
  const rw = targetRect.width + inset * 2
  const rh = targetRect.height + inset * 2
  const r = 12 // border-radius

  return (
    <>
      {/* Overlay with cut-out */}
      <div
        className="fixed inset-0 z-[65] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.4)',
          clipPath: `polygon(
            0% 0%, 0% 100%, ${rx}px 100%, ${rx}px ${ry}px,
            ${rx + rw}px ${ry}px, ${rx + rw}px ${ry + rh}px,
            ${rx}px ${ry + rh}px, ${rx}px 100%, 100% 100%, 100% 0%
          )`,
        }}
        onClick={onSkip}
      />

      {/* Highlight border around target */}
      <div
        className="fixed z-[65] rounded-xl border-2 border-brand shadow-[0_0_0_4px_rgba(228,169,48,0.15)] pointer-events-none transition-all duration-300"
        style={{
          top: ry,
          left: rx,
          width: rw,
          height: rh,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[66] w-72 rounded-2xl border border-primary-100 bg-surface p-5 shadow-xl"
        style={tooltipStyle}
      >
        {/* Step counter */}
        <div className="mb-3 flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-5 bg-brand' : 'w-1.5 bg-primary-200'
              }`}
            />
          ))}
          <span className="ml-auto text-xs text-primary-400">
            {step + 1} / {TOUR_STEPS.length}
          </span>
        </div>

        <h3 className="text-base font-bold text-primary-900">{currentStep.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-primary-500">
          {currentStep.description}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-primary-400 transition-colors hover:text-primary-600"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? onComplete : onNext}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-primary-900 transition-colors hover:bg-brand-dark"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export { TOUR_STEPS }
