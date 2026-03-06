'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

interface TourStep {
  target: string           // data-tour attribute value (desktop)
  mobileTarget?: string    // fallback data-tour value for mobile
  title: string
  mobileTitle?: string     // optional mobile-specific title
  description: string
  mobileDescription?: string // optional mobile-specific description
  position: 'right' | 'bottom' | 'top'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar-nav',
    mobileTarget: 'mobile-tab-bar',
    title: 'Your Navigation',
    description: 'Navigate between the library, clients, and settings from here.',
    mobileDescription: 'Use the tab bar to navigate between the library, clients, plans, and more.',
    position: 'right',
  },
  {
    target: 'nav-worksheets',
    mobileTarget: 'mobile-nav-worksheets',
    title: 'Library',
    description: 'Browse evidence-based CBT worksheets, create your own custom tools, or generate them with AI.',
    position: 'right',
  },
  {
    target: 'nav-clients',
    mobileTarget: 'mobile-nav-clients',
    title: 'Client Management',
    description: 'Add clients using non-identifiable labels, assign homework, and track completion — all GDPR-compliant.',
    position: 'right',
  },
  {
    target: 'nav-settings',
    mobileTarget: 'mobile-nav-more',
    title: 'Your Settings',
    mobileTitle: 'Settings & More',
    description: 'Manage your profile, subscription, and preferences here. You can also change the theme.',
    mobileDescription: 'Tap "More" to access your settings, blog, feature requests, and account preferences.',
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

/** Check whether an element is actually visible (not inside a hidden parent) */
function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  // Elements with display:none (e.g. sidebar on mobile) return a zero rect
  return rect.width > 0 && rect.height > 0
}

/**
 * Find the best visible target element for a step.
 * Tries the primary target first, then the mobile fallback.
 */
function findVisibleTarget(step: TourStep): { el: Element; isMobile: boolean } | null {
  const primaryEl = document.querySelector(`[data-tour="${step.target}"]`)
  if (primaryEl && isElementVisible(primaryEl)) {
    return { el: primaryEl, isMobile: false }
  }

  if (step.mobileTarget) {
    const mobileEl = document.querySelector(`[data-tour="${step.mobileTarget}"]`)
    if (mobileEl && isElementVisible(mobileEl)) {
      return { el: mobileEl, isMobile: true }
    }
  }

  return null
}

export function GuidedTour({ active, step, onNext, onPrev, onSkip, onComplete }: GuidedTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(220)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const isFirst = step === 0

  // Resolve display text (use mobile overrides when on mobile)
  const displayTitle = isMobile && currentStep?.mobileTitle
    ? currentStep.mobileTitle
    : currentStep?.title ?? ''
  const displayDescription = isMobile && currentStep?.mobileDescription
    ? currentStep.mobileDescription
    : currentStep?.description ?? ''

  // Measure actual tooltip height after render
  useEffect(() => {
    if (tooltipRef.current) {
      const measured = tooltipRef.current.getBoundingClientRect().height
      if (measured > 0) setTooltipHeight(measured)
    }
  })

  const updateTargetRect = useCallback(() => {
    if (!currentStep) return
    const result = findVisibleTarget(currentStep)
    if (result) {
      setIsMobile(result.isMobile)
      // Only scrollIntoView for non-fixed elements — fixed elements (mobile tab bar)
      // don't need scrolling and it causes janky page jumps
      const computedStyle = window.getComputedStyle(result.el)
      if (computedStyle.position !== 'fixed') {
        result.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
      // Small delay for scroll to complete
      setTimeout(() => {
        setTargetRect(result.el.getBoundingClientRect())
      }, 100)
    } else {
      // Target not found or not visible
      setTargetRect(null)
    }
  }, [currentStep])

  // Auto-skip steps whose target is invisible (both desktop and mobile targets)
  // Use a retry approach: check multiple times before giving up, to handle
  // cases where the DOM is still settling after a server component re-render
  useEffect(() => {
    if (!active || !currentStep) return

    let attempts = 0
    const maxAttempts = 10
    const retryInterval = 150 // ms between retries

    let timer: ReturnType<typeof setInterval> | null = null

    const tryFindTarget = () => {
      const result = findVisibleTarget(currentStep)
      if (result) {
        // Target found — update rect and stop retrying
        if (timer) clearInterval(timer)
        updateTargetRect()
        return
      }

      attempts++
      if (attempts >= maxAttempts) {
        // After ~1.5s of retrying, skip this step
        if (timer) clearInterval(timer)
        if (isLast) {
          onComplete()
        } else {
          onNext()
        }
      }
    }

    // Initial check
    const result = findVisibleTarget(currentStep)
    if (result) return // Target already visible, no need for retry loop

    // Start retry loop
    timer = setInterval(tryFindTarget, retryInterval)
    return () => { if (timer) clearInterval(timer) }
  }, [active, step, currentStep, isLast, onNext, onComplete, updateTargetRect])

  useEffect(() => {
    if (!active) return
    updateTargetRect()

    window.addEventListener('resize', updateTargetRect)
    return () => window.removeEventListener('resize', updateTargetRect)
  }, [active, step, updateTargetRect])

  if (!active || !currentStep || !targetRect) return null

  // Calculate tooltip position, keeping it within viewport
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const tooltipWidth = 288 // w-72 = 18rem = 288px
  const padding = 8
  const tooltipStyle: React.CSSProperties = {}

  // Determine effective position: mobile targets at bottom of screen use 'top' positioning
  const effectivePosition = isMobile ? 'top' : currentStep.position

  if (effectivePosition === 'top') {
    // Position above the target (for mobile tab bar at bottom of screen)
    tooltipStyle.top = Math.max(12, targetRect.top - padding - 12 - tooltipHeight)
    tooltipStyle.left = Math.max(12, Math.min((vw - tooltipWidth) / 2, vw - tooltipWidth - 12))
  } else if (effectivePosition === 'right' && targetRect.right + padding + 12 + tooltipWidth < vw) {
    // Position to the right of the target (desktop sidebar)
    tooltipStyle.top = Math.min(targetRect.top, vh - tooltipHeight)
    tooltipStyle.left = targetRect.right + padding + 12
  } else {
    // Position below the target (or fallback when right doesn't fit)
    tooltipStyle.top = Math.min(targetRect.bottom + padding + 12, vh - tooltipHeight)
    tooltipStyle.left = Math.max(12, Math.min(targetRect.left, vw - tooltipWidth - 12))
  }

  // Clip-path for spotlight cut-out
  const inset = 4
  const rx = targetRect.x - inset
  const ry = targetRect.y - inset
  const rw = targetRect.width + inset * 2
  const rh = targetRect.height + inset * 2

  // Render via portal to document.body to escape any ancestor with
  // transform/filter/will-change that creates a containing block and
  // breaks position:fixed (e.g. animate-fade-in on the main content area)
  return createPortal(
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
        // Don't dismiss tour on backdrop tap — too easy to trigger accidentally
        // on mobile. Users can use the "Skip tour" text link in the tooltip instead.
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

        <h3 className="text-base font-bold text-primary-900">{displayTitle}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-primary-500">
          {displayDescription}
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
    </>,
    document.body
  )
}

export { TOUR_STEPS }
