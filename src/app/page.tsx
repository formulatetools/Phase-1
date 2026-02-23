import Link from 'next/link'
import { Logo, LogoIcon } from '@/components/ui/logo'
import { PricingTable } from '@/components/marketing/pricing-table'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-primary-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/worksheets"
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
            >
              Worksheets
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-center">
          <LogoIcon size={56} />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-primary-900 sm:text-6xl">
          Professional CBT tools
          <br />
          <span className="text-brand">for clinicians</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-500">
          A curated library of evidence-based worksheets and clinical tools for
          therapists. Thought records, exposure hierarchies, behavioural
          activation schedules, and more — ready to use in session.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-primary-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-900"
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
      <section className="border-t border-primary-100 bg-primary-100/50 py-20">
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
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                ),
                title: 'Schema-driven worksheets',
                description:
                  'Dynamic, interactive worksheets that adapt to each clinical tool — from simple thought records to complex exposure hierarchies.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: 'Condition-specific tools',
                description:
                  'Organised by clinical presentation: depression, GAD, OCD, social anxiety, health anxiety, panic, PTSD, and more.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M9.75 8.25h.008v.008H9.75V8.25zm0 2.25h.008v.008H9.75V10.5z" />
                  </svg>
                ),
                title: 'Print & PDF export',
                description:
                  'Clean, print-friendly layouts. Export any worksheet as a PDF to share with clients or add to case notes.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
                title: 'Search & filter',
                description:
                  'Find the right tool fast with full-text search, category browsing, and clinical tag filtering.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
                title: 'Fraction of the cost',
                description:
                  'Professional-grade clinical tools starting free. Unlimited access from less than £2 per week.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
                title: 'Clinical data governance',
                description:
                  'Built with clinical data standards in mind. Audit trails, soft deletes, and GDPR-ready architecture.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-primary-900">
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
              <div key={i} className="rounded-2xl border border-primary-100 bg-white p-5 text-left shadow-sm">
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
      <section id="pricing" className="border-t border-primary-100 bg-primary-100/50 py-20">
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
            className="mt-8 inline-block rounded-lg bg-primary-800 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-900"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <LogoIcon size={18} />
              <p className="text-sm text-primary-400">
                &copy; {new Date().getFullYear()} Formulate. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-primary-400">
              <Link href="/worksheets" className="hover:text-primary-600 transition-colors">
                Worksheets
              </Link>
              <Link href="/pricing" className="hover:text-primary-600 transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="hover:text-primary-600 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary-600 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
