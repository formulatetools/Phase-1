'use client'

import { useState } from 'react'

export function ReferralLinkCard({
  referralLink,
  code,
}: {
  referralLink: string
  code: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = referralLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-light p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
          <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-primary-900">Your referral link</h2>
          <p className="text-xs text-primary-500">Share this link to invite colleagues to Formulate</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-primary-200 bg-surface px-3 py-2.5">
          <p className="truncate text-sm font-mono text-primary-700">{referralLink}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-primary-800 text-white hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <p className="mt-2 text-xs text-primary-400">
        Your code: <span className="font-mono font-semibold text-primary-600">{code}</span>
      </p>
    </div>
  )
}
