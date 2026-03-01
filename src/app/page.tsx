import Link from 'next/link'
import { createClient as createDirectClient } from '@supabase/supabase-js'
import { LogoIcon } from '@/components/ui/logo'
import { LandingNav } from '@/components/marketing/landing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { WorksheetPreview } from '@/components/marketing/worksheet-preview'
import { AIGenerateTeaser } from '@/components/marketing/ai-generate-teaser'
import { PricingTable } from '@/components/marketing/pricing-table'
import { ClientExperienceDemo } from '@/components/marketing/client-experience-demo'
import { buttonVariants } from '@/components/ui/button-variants'
import { DEMO_WORKSHEETS } from '@/lib/demo-data'
import type { Worksheet } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Formulate — AI-Powered CBT Worksheets for Therapists',
  description:
    'Interactive, evidence-based CBT worksheets that clients complete digitally. Generate custom worksheets with AI, build formulation diagrams, assign homework via a link, and review responses.',
  openGraph: {
    title: 'Formulate — AI-Powered CBT Worksheets for Therapists',
    description:
      'Generate custom CBT worksheets with AI. Interactive formulation diagrams, homework links, and a curated clinical library — all in one platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Formulate — AI-Powered CBT Worksheets for Therapists',
    description:
      'Generate custom CBT worksheets with AI. Interactive formulation diagrams, homework links, and a curated clinical library — all in one platform.',
  },
  alternates: {
    canonical: '/',
  },
}

export default async function Home() {
  // Fetch real worksheet schemas for the interactive preview
  const supabase = createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const demoSlugs = DEMO_WORKSHEETS.map((w) => w.slug)
  const { data: worksheetRows } = await supabase
    .from('worksheets')
    .select('slug, title, description, instructions, schema')
    .in('slug', demoSlugs)
    .eq('is_published', true)
    .is('deleted_at', null)

  // Preserve DEMO_WORKSHEETS ordering
  const demoWorksheets = demoSlugs
    .map((slug) => worksheetRows?.find((r) => r.slug === slug))
    .filter(Boolean) as Pick<Worksheet, 'slug' | 'title' | 'description' | 'instructions' | 'schema'>[]

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
          clients complete digitally — or describe what you need and let AI
          build it in seconds.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className={buttonVariants.primary('lg')}
          >
            Get Started Free
          </Link>
          <a
            href="#preview"
            className={buttonVariants.secondary('lg')}
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
            {demoWorksheets.length > 0 && (
              <WorksheetPreview worksheets={demoWorksheets} />
            )}
          </div>
        </div>
      </section>

      {/* AI Showcase — Interactive Teaser */}
      <section id="ai" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              AI-Powered
            </span>
            <h2 className="mt-4 text-3xl font-bold text-primary-900">
              Describe it. We&apos;ll build it.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-500">
              Type a description like &ldquo;health anxiety maintenance formulation&rdquo;
              or &ldquo;thought record for social anxiety&rdquo; — and get a complete,
              clinically accurate worksheet in seconds. Try it now.
            </p>
          </div>

          {/* Interactive AI generation demo */}
          <AIGenerateTeaser />

          {/* Feature highlights below the teaser */}
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-surface p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-900">Generate from text</h3>
                <p className="mt-1 text-xs text-primary-500">
                  Describe any CBT worksheet — AI generates fields, layout, and clinical structure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-surface p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-900">Import from PDF</h3>
                <p className="mt-1 text-xs text-primary-500">
                  Upload existing paper worksheets and convert them to interactive digital versions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-surface p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-900">Formulation diagrams</h3>
                <p className="mt-1 text-xs text-primary-500">
                  Five areas, vicious flowers, maintenance cycles, CFT — all interactive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-primary-100 bg-primary-100/50 py-20">
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

      {/* Try the client experience */}
      <section id="demo" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ClientExperienceDemo />
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
                title: 'Assign homework via a link',
                description:
                  'Your client completes a worksheet digitally and you review their responses before the next session. No printing, no scanning.',
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
                title: 'Build or generate your own',
                description:
                  'Create custom worksheets with our builder, or describe what you need and let AI generate it. Fork any curated tool.',
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
              <div key={feature.title} className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
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
            className={`mt-8 inline-block ${buttonVariants.primary('lg')}`}
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  )
}
