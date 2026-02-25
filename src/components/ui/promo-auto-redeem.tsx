'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { redeemPromoCode } from '@/app/(dashboard)/promo/actions'

interface PromoAutoRedeemProps {
  promoCode: string | null
  isFree: boolean
}

export function PromoAutoRedeem({ promoCode, isFree }: PromoAutoRedeemProps) {
  const router = useRouter()
  const attemptedRef = useRef(false)
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!promoCode || !isFree || attemptedRef.current) return
    attemptedRef.current = true

    async function autoRedeem() {
      const res = await redeemPromoCode(promoCode!)

      if ('error' in res) {
        setResult({ type: 'error', message: res.error })
      } else {
        setResult({
          type: 'success',
          message: `You've got ${res.durationDays} days of ${res.tierLabel} — enjoy!`,
        })
        router.refresh()
      }

      // Clear the promo_code from user metadata regardless of outcome
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { promo_code: null } })
    }

    autoRedeem()
  }, [promoCode, isFree, router])

  if (!result) return null

  if (result.type === 'success') {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-primary-900">Promo code applied!</p>
          <p className="text-sm text-primary-600">{result.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <p className="font-medium text-primary-900">Promo code issue</p>
        <p className="text-sm text-primary-600">{result.message} You can try again in Settings.</p>
      </div>
    </div>
  )
}
