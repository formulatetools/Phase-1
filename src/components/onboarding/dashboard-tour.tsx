'use client'

import { useEffect } from 'react'
import { WelcomeModal } from './welcome-modal'
import { GuidedTour } from './guided-tour'
import { useTour } from '@/hooks/use-tour'

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

  return (
    <>
      {showWelcome && <WelcomeModal open={true} onStartTour={tour.start} />}
      <GuidedTour
        active={tour.active}
        step={tour.step}
        onNext={tour.next}
        onPrev={tour.prev}
        onSkip={tour.skip}
        onComplete={tour.complete}
      />
    </>
  )
}
