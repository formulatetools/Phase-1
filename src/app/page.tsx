import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { LandingNav } from '@/components/marketing/landing-nav'
import { WorksheetPreview } from '@/components/marketing/worksheet-preview'
import { PricingTable } from '@/components/marketing/pricing-table'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-center">
          <LogoIcon size={56} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
          Stop printing PDFs.
          <br />
          <span className="text-brand">Start assigning interactive homework.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-500">
          Formulate gives therapists a curated library of CBT worksheets that
          clients complete digitally — structured, evidence-based, and ready to
          review.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-primary-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-900"
          >
            Get Started Free
          </Link>
          <a
            href="#preview"
            className="rounded-lg border border-primary-200 bg-white px-6 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            See it in action &darr;
          </a>
        </div>
        <p className="mt-4 text-xs text-primary-400">
          Free forever. No credit card required.
        </p>
      </section>

      {/* Interactive Preview */}
      <section id="preview" className="border-t border-primary-100 bg-primary-100/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-primary-900">
            See what your clients see
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-primary-500">
            Interactive, structured worksheets that guide your clients through
            evidence-based exercises — right in their browser.
          </p>
          <div className="mt-12">
            <WorksheetPreview />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-primary-900">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-primary-500">
            Three steps to better between-session homework.
          </p>

          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-lg">
                1
              </div>
              <div className="mt-5 flex justify-center">
                <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-semibold text-primary-900">Assign</h3>
              <p className="mt-2 text-sm text-primary-500">
                Choose a worksheet from the library and share a link with your client.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-lg">
                2
              </div>
              <div className="mt-5 flex justify-center">
                <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-semibold text-primary-900">Complete</h3>
              <p className="mt-2 text-sm text-primary-500">
                Your client fills it in between sessions — on any device, at their own pace.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-lg">
                3
              </div>
              <div className="mt-5 flex justify-center">
                <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-semibold text-primary-900">Review</h3>
              <p className="mt-2 text-sm text-primary-500">
                See their responses before the next session. No paper. No scanning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-primary-100 bg-primary-100/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-primary-900">
            Everything you need in one place
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-primary-500">
            Built by clinicians, for clinicians. Every feature designed to save
            you time and improve outcomes.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                ),
                title: 'Homework that actually gets done',
                description:
                  'Interactive digital worksheets your clients fill in on phone, tablet, or computer. No more lost paper.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: 'Built for the therapy room',
                description:
                  'Every tool designed by clinicians. Thought records, exposure hierarchies, behavioural activation, and more.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                ),
                title: 'Share in seconds',
                description:
                  'Send a worksheet link or generate a PDF. No printing, no scanning, no chasing.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
                title: 'Find the right tool fast',
                description:
                  'Search by condition, technique, or keyword. Filter by anxiety, depression, OCD, trauma, and more.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.174A1.125 1.125 0 014.5 17.28V5.97a1.125 1.125 0 011.536-1.064l5.384 3.174m0 0L16.804 5.9a1.125 1.125 0 011.536 1.064v11.31a1.125 1.125 0 01-1.536 1.064l-5.384-3.174m0 0L6.92 18.626" />
                  </svg>
                ),
                title: 'Build your own',
                description:
                  'Create custom worksheets with our drag-and-drop builder. Fork any curated tool and make it yours.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
                title: 'Secure by design',
                description:
                  'Client data protected with audit trails, row-level security, and GDPR-ready architecture.',
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

      {/* Social proof */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary-400">
            Trusted by CBT practitioners across the UK
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-primary-100 bg-primary-100/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
            Ready to ditch the photocopier?
          </h2>
          <p className="mt-4 text-primary-500">
            Create your free account and start assigning interactive homework today.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-primary-800 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-900"
          >
            Get Started Free
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
            <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-400">
              <Link href="/worksheets" className="hover:text-primary-600 transition-colors">
                Worksheets
              </Link>
              <Link href="/pricing" className="hover:text-primary-600 transition-colors">
                Pricing
              </Link>
              <Link href="/feature-requests" className="hover:text-primary-600 transition-colors">
                Feature Requests
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
