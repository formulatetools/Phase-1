import { PricingTable } from '@/components/marketing/pricing-table'
import { KEY_FAQ, EXTENDED_FAQ } from '@/lib/faq-data'
import { KeyFaqList } from '@/components/marketing/faq-accordion'

export const metadata = {
  title: 'Pricing',
  description: 'Professional CBT tools starting free. Unlimited worksheet access from £4.99/month.',
  openGraph: {
    title: 'Pricing — Formulate',
    description: 'Professional CBT tools starting free. Unlimited worksheet access from £4.99/month.',
  },
  alternates: {
    canonical: '/pricing',
  },
}

// ── Feature comparison matrix data ───────────────────────────────────────────

const comparisonRows = [
  { feature: 'Worksheet library', free: '✓', starter: '✓', practice: '✓', specialist: '✓' },
  { feature: 'Monthly uses', free: '5', starter: 'Unlimited', practice: 'Unlimited', specialist: 'Unlimited' },
  { feature: 'Clients', free: '3', starter: '8', practice: 'Unlimited', specialist: 'Unlimited' },
  { feature: 'Custom worksheets', free: '—', starter: '3', practice: '15', specialist: 'Unlimited' },
  { feature: 'AI generations / month', free: '1', starter: '3', practice: '10', specialist: 'Unlimited' },
  { feature: 'Homework plans', free: '—', starter: '1', practice: '3', specialist: 'Unlimited' },
  { feature: 'Fork & customise', free: '—', starter: '—', practice: '✓', specialist: '✓' },
  { feature: 'Supervision portal', free: '—', starter: '—', practice: 'Up to 4', specialist: 'Unlimited' },
  { feature: 'PDF branding', free: 'Watermark', starter: 'Minimal', practice: 'Minimal', specialist: 'Minimal' },
]

// ── Pricing FAQs — select from existing FAQ data ─────────────────────────────

const pricingFaqQuestions = [
  'How much does Formulate cost?',
  'Can I cancel at any time?',
  'What happens to my data if I downgrade?',
  'Do you offer student or trainee discounts?',
  'What payment methods do you accept?',
]

const allFaqItems = [
  ...KEY_FAQ,
  ...EXTENDED_FAQ.flatMap((cat) => cat.questions),
]

const pricingFaqs = pricingFaqQuestions
  .map((q) => allFaqItems.find((item) => item.q === q))
  .filter(Boolean) as typeof allFaqItems

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-900">
          Professional tools at a fraction of the cost
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-500">
          Get started free with 5 tools per month. Upgrade for unlimited access
          to every worksheet in the library.
        </p>
      </div>

      <div className="mt-12">
        <PricingTable />
      </div>

      {/* Feature comparison matrix */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold text-primary-900">
          Compare plans
        </h2>
        <p className="mt-2 text-center text-sm text-primary-500">
          See exactly what you get at every tier.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200">
                <th className="py-3 pr-4 text-left font-medium text-primary-700">Feature</th>
                <th className="px-4 py-3 text-center font-medium text-primary-700">Free</th>
                <th className="px-4 py-3 text-center font-medium text-primary-700">Starter</th>
                <th className="px-4 py-3 text-center font-medium text-primary-700">
                  <span className="rounded-full bg-primary-800 px-2 py-0.5 text-xs text-white">Practice</span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-primary-700">Specialist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3 pr-4 font-medium text-primary-900">{row.feature}</td>
                  <td className="px-4 py-3 text-center text-primary-600">{row.free}</td>
                  <td className="px-4 py-3 text-center text-primary-600">{row.starter}</td>
                  <td className="px-4 py-3 text-center text-primary-600">{row.practice}</td>
                  <td className="px-4 py-3 text-center text-primary-600">{row.specialist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing FAQs */}
      {pricingFaqs.length > 0 && (
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold text-primary-900">
            Pricing FAQ
          </h2>
          <div className="mt-8">
            <KeyFaqList items={pricingFaqs} />
          </div>
        </div>
      )}
    </main>
  )
}
