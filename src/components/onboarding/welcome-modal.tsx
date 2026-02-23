'use client'

import { useState } from 'react'
import { completeOnboarding } from '@/app/(dashboard)/dashboard/actions'

interface WelcomeModalProps {
  open: boolean
}

const slides = [
  {
    icon: (
      <svg className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'Welcome to Formulate',
    description:
      'A professional toolkit for CBT therapists. Browse evidence-based worksheets, manage your clients, and assign homework — all in one place.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: 'Browse Professional Worksheets',
    description:
      'Explore a curated library of CBT worksheets organised by therapeutic domain. Search, filter by tag, and preview before using with clients.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: 'Manage Your Clients',
    description:
      'Add clients using non-identifiable labels, assign worksheets as homework via secure links, and track completion — all GDPR-compliant.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: 'Export & Share',
    description:
      'Download worksheets as A4 PDFs for sessions, or share secure homework links with QR codes. Clients don\u2019t need an account.',
  },
]

export function WelcomeModal({ open }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(open)

  const handleDismiss = async () => {
    setVisible(false)
    await completeOnboarding()
  }

  if (!visible) return null

  const slide = slides[step]
  const isLast = step === slides.length - 1

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-primary-100 bg-white p-8 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        {/* Top: step dots + skip */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-brand' : 'bg-primary-200 hover:bg-primary-300'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
          {!isLast && (
            <button
              onClick={handleDismiss}
              className="text-sm text-primary-400 transition-colors hover:text-primary-600"
            >
              Skip
            </button>
          )}
        </div>

        {/* Icon */}
        <div className="mt-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            {slide.icon}
          </div>
        </div>

        {/* Content */}
        <h2
          id="welcome-title"
          className="mt-6 text-center text-xl font-bold text-primary-900"
        >
          {slide.title}
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-primary-500">
          {slide.description}
        </p>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              onClick={handleDismiss}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
