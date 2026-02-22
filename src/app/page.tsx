import Link from 'next/link'
import { PricingTable } from '@/components/marketing/pricing-table'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-primary-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary-900">
            Formulate
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/worksheets"
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              Worksheets
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight text-primary-900 sm:text-6xl">
          Professional CBT tools
          <br />
          <span className="text-accent-600">for clinicians</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-500">
          A curated library of evidence-based worksheets and clinical tools for
          therapists. Thought records, exposure hierarchies, behavioural
          activation schedules, and more — ready to use in session.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-accent-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-700"
          >
            Create Free Account
          </Link>
          <Link
            href="/worksheets"
            className="rounded-lg border border-primary-200 bg-white px-6 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            Browse Library
          </Link>
        </div>
        <p className="mt-4 text-xs text-primary-400">
          5 tools free every month. No credit card required.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-primary-100 bg-primary-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-primary-900">
            Built for clinical practice
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-primary-500">
            Every tool is designed by clinicians, grounded in evidence, and
            optimised for use in therapy sessions.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '📋',
                title: 'Schema-driven worksheets',
                description:
                  'Dynamic, interactive worksheets that adapt to each clinical tool — from simple thought records to complex exposure hierarchies.',
              },
              {
                icon: '🏥',
                title: 'Condition-specific tools',
                description:
                  'Organised by clinical presentation: depression, GAD, OCD, social anxiety, health anxiety, panic, PTSD, and more.',
              },
              {
                icon: '🖨',
                title: 'Print & PDF export',
                description:
                  'Clean, print-friendly layouts. Export any worksheet as a PDF to share with clients or add to case notes.',
              },
              {
                icon: '🔍',
                title: 'Search & filter',
                description:
                  'Find the right tool fast with full-text search, category browsing, and clinical tag filtering.',
              },
              {
                icon: '💰',
                title: 'Fraction of the cost',
                description:
                  'Professional-grade clinical tools starting free. Unlimited access from less than £2 per week.',
              },
              {
                icon: '🔒',
                title: 'Clinical data governance',
                description:
                  'Built with clinical data standards in mind. Audit trails, soft deletes, and GDPR-ready architecture.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="text-2xl">{feature.icon}</div>
                <h3 className="mt-3 text-base font-semibold text-primary-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-primary-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-400">
            Trusted by CBT practitioners
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: 'Testimonial placeholder — real feedback from beta users will go here.',
                name: 'Dr. A. Smith',
                role: 'Clinical Psychologist',
              },
              {
                quote: 'Testimonial placeholder — real feedback from beta users will go here.',
                name: 'J. Patel',
                role: 'CBT Therapist',
              },
              {
                quote: 'Testimonial placeholder — real feedback from beta users will go here.',
                name: 'Dr. R. Chen',
                role: 'Trainee Psychologist',
              },
            ].map((t, i) => (
              <div key={i} className="rounded-xl border border-primary-100 p-5 text-left">
                <p className="text-sm italic text-primary-500">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-3 text-sm font-medium text-primary-900">{t.name}</p>
                <p className="text-xs text-primary-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-primary-100 bg-primary-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-primary-900">
            Get started free, upgrade when you&apos;re ready
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-primary-500">
            Professional tools at a fraction of the cost. Start with 5 free
            tools per month.
          </p>
          <div className="mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-900">
            Ready to streamline your practice?
          </h2>
          <p className="mt-4 text-primary-500">
            Join clinicians using Formulate to deliver better outcomes.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-accent-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-700"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-primary-400">
              &copy; {new Date().getFullYear()} Formulate. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-primary-400">
              <Link href="/worksheets" className="hover:text-primary-600">
                Worksheets
              </Link>
              <Link href="/pricing" className="hover:text-primary-600">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
