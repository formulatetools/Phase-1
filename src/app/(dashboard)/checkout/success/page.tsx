import Link from 'next/link'
import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe/client'
import { TIER_LABELS, TIER_FEATURES } from '@/lib/stripe/config'

export const metadata = {
  title: 'Subscription Activated — Formulate',
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) redirect('/dashboard')

  // Verify the checkout session with Stripe
  let tier: string = 'starter'
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') redirect('/dashboard')
    tier = (session.metadata?.tier as string) || 'starter'
  } catch {
    redirect('/dashboard')
  }

  const tierLabel = TIER_LABELS[tier] || 'Starter'
  const features = TIER_FEATURES[tier] || TIER_FEATURES.starter

  const nextSteps = [
    {
      title: 'Browse worksheets',
      description: 'Explore the full library of CBT tools',
      href: '/worksheets',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      color: 'bg-brand/10 text-brand',
    },
    {
      title: 'Set up clients',
      description: 'Add clients and start assigning worksheets',
      href: '/clients',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Your tools',
      description: 'Access your saved and custom worksheets',
      href: '/my-tools',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1 3.03c-.47.28-1.07-.11-.97-.64l.97-5.68L1.65 7.56c-.38-.37-.19-1.02.31-1.1l5.7-.83L10.2.93c.24-.48.93-.48 1.16 0l2.55 5.17 5.7.83c.5.07.69.72.31 1.1l-4.13 4.02.98 5.68c.09.53-.51.93-.98.64l-5.1-3.03z" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-800 text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <h1 className="mt-6 text-2xl font-bold text-primary-900 sm:text-3xl">
          Welcome to {tierLabel}!
        </h1>
        <p className="mt-2 text-primary-500">
          Your subscription is now active. Here&apos;s what you&apos;ve unlocked:
        </p>

        {/* Features card */}
        <div className="mt-8 rounded-2xl border border-primary-100 bg-surface p-6 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
              {tierLabel}
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-primary-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Next steps */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {nextSteps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="group rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${step.color} transition-colors group-hover:bg-primary-800 group-hover:text-white`}>
                {step.icon}
              </div>
              <p className="mt-3 text-sm font-semibold text-primary-800">{step.title}</p>
              <p className="mt-0.5 text-xs text-primary-400">{step.description}</p>
            </Link>
          ))}
        </div>

        {/* Dashboard link */}
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Go to dashboard
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
