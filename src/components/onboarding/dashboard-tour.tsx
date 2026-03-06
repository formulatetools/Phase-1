'use client'

import { useEffect, useCallback } from 'react'
import { WelcomeModal } from './welcome-modal'
import { GuidedTour } from './guided-tour'
import { useTour } from '@/hooks/use-tour'
import { completeOnboarding } from '@/app/(dashboard)/dashboard/actions'

interface DashboardTourProps {
  showWelcome: boolean
}

export function DashboardTour({ showWelcome }: DashboardTourProps) {
  const tour = useTour()

  // Listen for "Take a tour" custom event from OnboardingChecklist
  useEffect(() => {
    const handler = () => tour.start()
    window.addEventListener('formulate:start-tour', handler)
    return () => window.removeEventListener('formulate:start-tour', handler)
  }, [tour.start])

  // When the tour finishes (complete or skip), mark onboarding as done.
  // This is done here instead of in WelcomeModal because completeOnboarding()
  // calls revalidatePath('/dashboard') which would remount this component
  // and reset the tour state if called during the tour.
  const handleTourEnd = useCallback(() => {
    tour.complete()
    if (showWelcome) {
      // Only call completeOnboarding if this was the first-time flow
      // (not a re-trigger from the "Take a tour" checklist button)
      completeOnboarding().catch(() => {})
    }
  }, [tour.complete, showWelcome])

  return (
    <>
      {showWelcome && <WelcomeModal open={true} onStartTour={tour.start} />}
      <GuidedTour
        active={tour.active}
        step={tour.step}
        onNext={tour.next}
        onPrev={tour.prev}
        onSkip={handleTourEnd}
        onComplete={handleTourEnd}
      />
    </>
  )
}
