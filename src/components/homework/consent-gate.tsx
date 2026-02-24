'use client'

import { useState, useRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { BlankPdfGenerator, type BlankPdfGeneratorHandle } from './blank-pdf-generator'

interface ConsentGateProps {
  token: string
  initialHasConsent: boolean
  worksheetTitle: string
  worksheetSchema: WorksheetSchema
  children: React.ReactNode
}

export function ConsentGate({
  token,
  initialHasConsent,
  worksheetTitle,
  worksheetSchema,
  children,
}: ConsentGateProps) {
  const [consented, setConsented] = useState(initialHasConsent)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pdfRef = useRef<BlankPdfGeneratorHandle>(null)

  // If already consented (server-checked), render children immediately
  if (consented) {
    return <>{children}</>
  }

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch('/api/homework/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'accept' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to record consent')
      }

      setConsented(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    setDeclining(true)
    setError(null)

    try {
      // Record the decline (updates assignment status to pdf_downloaded)
      const res = await fetch('/api/homework/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'decline' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process')
      }

      // Generate the blank PDF
      if (pdfRef.current) {
        await pdfRef.current.generatePdf()
      }

      setDeclined(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeclining(false)
    }
  }

  // Post-decline confirmation
  if (declined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-primary-100 bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary-900">PDF downloaded</h2>
          <p className="mt-2 text-sm text-primary-500">
            Your blank worksheet has been downloaded. You can print it and complete it by hand, then bring it to your next session.
          </p>
          <p className="mt-4 text-xs text-primary-400">
            Changed your mind? You can open this link again to complete the worksheet online.
          </p>
        </div>

        <BlankPdfGenerator
          ref={pdfRef}
          schema={worksheetSchema}
          worksheetTitle={worksheetTitle}
        />
      </div>
    )
  }

  // Consent screen
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-primary-100 bg-surface p-8 shadow-sm">
        {/* Shield icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
          <svg className="h-7 w-7 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <h2 className="text-center text-xl font-bold text-primary-900">Before you begin</h2>
        <p className="mt-2 text-center text-sm text-primary-500">
          Your therapist has asked you to complete this worksheet using Formulate, a secure online tool.
        </p>

        {/* Data handling info */}
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-primary-700">If you complete this online:</p>
          <ul className="space-y-2.5 text-sm text-primary-600">
            <li className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Your responses are stored securely and encrypted
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Only your therapist can see what you write
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              You are identified by a code, not your name
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              You can delete your responses at any time
            </li>
          </ul>
        </div>

        {/* Alternative option */}
        <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/50 p-3 text-sm text-primary-600">
          You don&apos;t have to complete this online. You can download a blank copy to fill in on paper instead.
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Action buttons — equally prominent */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="flex-1 rounded-lg bg-primary-800 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-900 disabled:opacity-50"
          >
            {accepting ? 'Processing…' : 'Complete Online'}
          </button>
          <button
            onClick={handleDecline}
            disabled={accepting || declining}
            className="flex-1 rounded-lg border border-primary-300 bg-surface px-5 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-50"
          >
            {declining ? 'Generating PDF…' : 'Download Blank PDF Instead'}
          </button>
        </div>

        {/* Legal text */}
        <p className="mt-4 text-center text-xs text-primary-400">
          By choosing &quot;Complete Online&quot; you agree to our{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-600">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-600">
            Terms of Use
          </a>.
        </p>
      </div>

      {/* Hidden PDF generator for decline flow */}
      <BlankPdfGenerator
        ref={pdfRef}
        schema={worksheetSchema}
        worksheetTitle={worksheetTitle}
      />
    </div>
  )
}
