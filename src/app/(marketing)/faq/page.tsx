import type { Metadata } from 'next'
import { KEY_FAQ, EXTENDED_FAQ } from '@/lib/faq-data'
import { KeyFaqList, ExtendedFaqSection } from '@/components/marketing/faq-accordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Formulate — privacy, pricing, worksheets, homework, and more.',
  alternates: {
    canonical: '/faq',
  },
}

// Combine Key + Extended for structured data (Google rich results)
const allQuestions = [
  ...KEY_FAQ,
  ...EXTENDED_FAQ.flatMap((cat) => cat.questions),
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allQuestions.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function FaqPage() {
  return (
    <>
      {/* FAQPage structured data for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-500">
            Everything you need to know about using Formulate in your practice.
          </p>
        </div>

        {/* Key FAQ — always visible */}
        <section className="mt-12">
          <KeyFaqList items={KEY_FAQ} />
        </section>

        {/* Divider */}
        <div className="mt-16 border-t border-primary-200 pt-12">
          <h2 className="text-center text-lg font-semibold text-primary-700">
            More Questions
          </h2>
          <p className="mt-1 text-center text-sm text-primary-400">
            Tap a category to expand
          </p>
        </div>

        {/* Extended FAQ — collapsed categories */}
        <section className="mt-8">
          <ExtendedFaqSection categories={EXTENDED_FAQ} />
        </section>

        {/* Contact CTA */}
        <div className="mt-16 rounded-xl border border-primary-100 bg-primary-50 p-6 text-center">
          <p className="text-sm font-medium text-primary-700">
            Still have a question?
          </p>
          <p className="mt-1 text-sm text-primary-500">
            Drop us a line at{' '}
            <a
              href="mailto:hello@formulatetools.co.uk"
              className="font-medium text-brand underline decoration-brand/30 hover:decoration-brand"
            >
              hello@formulatetools.co.uk
            </a>
          </p>
        </div>
      </main>
    </>
  )
}
