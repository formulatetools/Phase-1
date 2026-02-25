'use client'

import { useState } from 'react'
import Link from 'next/link'

type BillingPeriod = 'monthly' | 'annual'

const tiers = [
  {
    name: 'Free',
    description: 'Try it out with 5 tools a month',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Browse the full worksheet library',
      '5 worksheet uses per month',
      'PDF export (Formulate branding)',
      'Read all descriptions & instructions',
    ],
    cta: 'Create Free Account',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    description: 'Unlimited access for solo practitioners',
    monthlyPrice: 4.99,
    annualPrice: 47.90,
    features: [
      'Everything in Free',
      'Unlimited worksheet access',
      'Clean PDF export (no branding)',
      'Bookmark & favourite tools',
    ],
    cta: 'Get Started',
    checkoutTier: 'starter' as const,
    highlighted: false,
  },
  {
    name: 'Practice',
    description: 'Client management & custom tools',
    monthlyPrice: 9.99,
    annualPrice: 95.90,
    features: [
      'Everything in Starter',
      'Client management dashboard',
      'Share worksheets with clients',
      'Custom worksheet builder',
      'Fork & customise any tool',
    ],
    cta: 'Get Started',
    checkoutTier: 'standard' as const,
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Specialist',
    description: 'Advanced tools for specialist clinicians',
    monthlyPrice: 19.99,
    annualPrice: 191.90,
    features: [
      'Everything in Practice',
      'CPD video training content',
      'Early access to new features',
      'AI-assisted formulation (coming soon)',
      'Psychometric tracking (coming soon)',
    ],
    cta: 'Get Started',
    checkoutTier: 'professional' as const,
    highlighted: false,
  },
]

export function PricingTable() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-primary-100 p-1">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-surface text-primary-900 shadow-sm'
                : 'text-primary-500 hover:text-primary-700'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annual')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === 'annual'
                ? 'bg-surface text-primary-900 shadow-sm'
                : 'text-primary-500 hover:text-primary-700'
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs text-brand-text">Save 2 months</span>
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const price = period === 'monthly' ? tier.monthlyPrice : tier.annualPrice
          const perMonth =
            period === 'annual' && tier.annualPrice > 0
              ? (tier.annualPrice / 12).toFixed(2)
              : null

          return (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-6 ${
                tier.highlighted
                  ? 'border-brand/30 bg-surface shadow-lg ring-1 ring-brand/20'
                  : 'border-primary-200 bg-surface shadow-sm'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary-800 dark:bg-primary-200 px-3 py-1 text-xs font-medium text-white dark:text-primary-900 whitespace-nowrap">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary-900">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-primary-500">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                {price === 0 ? (
                  <p className="text-3xl font-bold text-primary-900">Free</p>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-primary-900">
                      £{price}
                      <span className="text-base font-normal text-primary-500">
                        /{period === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </p>
                    {perMonth && (
                      <p className="mt-1 text-sm text-primary-400">
                        £{perMonth}/mo billed annually
                      </p>
                    )}
                    {period === 'annual' && tier.monthlyPrice > 0 && (
                      <span className="mt-2 inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Save {Math.round((1 - tier.annualPrice / (tier.monthlyPrice * 12)) * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-primary-600">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {tier.checkoutTier ? (
                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="tier" value={tier.checkoutTier} />
                  <input type="hidden" name="period" value={period} />
                  <button
                    type="submit"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      tier.highlighted
                        ? 'bg-primary-800 text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300'
                        : 'border border-primary-200 bg-surface text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    {tier.cta}
                  </button>
                </form>
              ) : (
                <Link
                  href={tier.href || '/signup'}
                  className="block w-full rounded-lg border border-primary-200 bg-surface px-4 py-2.5 text-center text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
