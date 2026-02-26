'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Worksheet } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from './worksheet-renderer'
import { WorksheetExport } from './worksheet-export'
import { buttonVariants } from '@/components/ui/button'
import { trackAccess } from '@/app/(dashboard)/worksheets/actions'

type AccessState = 'unauthenticated' | 'free_available' | 'free_limit_reached' | 'subscribed'

interface Props {
  worksheet: Worksheet
  accessState: AccessState
  usesRemaining: number
}

export function WorksheetDetail({ worksheet, accessState, usesRemaining }: Props) {
  const trackedRef = useRef(false)

  // Track 'interact' access for free/subscribed users
  useEffect(() => {
    if (
      !trackedRef.current &&
      (accessState === 'free_available' || accessState === 'subscribed')
    ) {
      trackedRef.current = true
      trackAccess(worksheet.id, 'interact')
    }
  }, [worksheet.id, accessState])

  const handleExport = () => {
    trackAccess(worksheet.id, 'export')
  }

  // State 1: Unauthenticated visitor
  if (accessState === 'unauthenticated') {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-8 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold text-primary-900">
            Access this worksheet
          </h3>
          <p className="mt-2 text-sm text-primary-600">
            Create a free account to access 5 professional CBT tools per month.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/signup"
              className={buttonVariants.primary('lg')}
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className={buttonVariants.secondary('lg')}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // State 3: Free tier, limit reached
  if (accessState === 'free_limit_reached') {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-8 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold text-primary-900">
            Monthly limit reached
          </h3>
          <p className="mt-2 text-sm text-primary-600">
            You&apos;ve used all 5 free worksheet accesses this month.
            Upgrade for unlimited access to every tool in the library.
          </p>
          <div className="mt-6 rounded-lg bg-surface p-4 text-left shadow-sm ring-1 ring-primary-100">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-semibold text-primary-900">Starter</p>
                <p className="text-sm text-primary-500">Unlimited worksheets</p>
              </div>
              <p className="text-lg font-bold text-primary-900">
                £4.99<span className="text-sm font-normal text-primary-500">/mo</span>
              </p>
            </div>
            <p className="mt-2 text-xs text-primary-400">
              Unlimited access from less than £1 per week
            </p>
          </div>
          <Link
            href="/pricing"
            className={`mt-4 inline-block ${buttonVariants.accent()}`}
          >
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  // State 2 & 4: Free with uses remaining, or subscribed
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {accessState === 'free_available' && (
          <p className="text-sm text-primary-500">
            {usesRemaining} free use{usesRemaining !== 1 ? 's' : ''} remaining this month
          </p>
        )}
        <div className={`flex items-center gap-2 ${accessState === 'subscribed' ? 'ml-auto' : ''}`}>
          {accessState === 'subscribed' && (
            <Link
              href={`/my-tools/new?fork=${worksheet.id}`}
              className={buttonVariants.secondary()}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              Customise
            </Link>
          )}
          <WorksheetExport
            worksheetTitle={worksheet.title}
            onExport={handleExport}
            showBranding={accessState === 'free_available'}
            schema={worksheet.schema as unknown as WorksheetSchema}
            worksheetDescription={worksheet.description}
            worksheetInstructions={worksheet.instructions}
          />
        </div>
      </div>

      <div data-worksheet-content className="rounded-xl border border-primary-100 bg-surface p-6 shadow-sm">
        <WorksheetRenderer schema={worksheet.schema as unknown as WorksheetSchema} />
      </div>
    </div>
  )
}
