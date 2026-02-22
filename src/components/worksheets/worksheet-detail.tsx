'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Worksheet } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from './worksheet-renderer'
import { WorksheetExport } from './worksheet-export'
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
              className="rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-primary-200 bg-white px-5 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
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
          <div className="mt-6 rounded-lg bg-white p-4 text-left shadow-sm ring-1 ring-primary-100">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-semibold text-primary-900">Standard</p>
                <p className="text-sm text-primary-500">Unlimited worksheets</p>
              </div>
              <p className="text-lg font-bold text-primary-900">
                £7.99<span className="text-sm font-normal text-primary-500">/mo</span>
              </p>
            </div>
            <p className="mt-2 text-xs text-primary-400">
              Professional tools at a fraction of the cost
            </p>
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-block rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900"
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
        <div className={accessState === 'subscribed' ? 'ml-auto' : ''}>
          <WorksheetExport
            worksheetTitle={worksheet.title}
            onExport={handleExport}
          />
        </div>
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <WorksheetRenderer schema={worksheet.schema as unknown as WorksheetSchema} />
      </div>
    </div>
  )
}
