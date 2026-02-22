import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'

export const metadata = {
  title: 'Privacy Policy — Formulate',
  description: 'How Formulate handles your data. Our commitment to privacy and data protection.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon size={24} />
          <span className="text-lg font-semibold text-primary-800">formulate</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-primary-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-primary-400">Draft — last updated February 2026. This policy requires legal review before formal publication.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-primary-700">
        <section>
          <h2 className="text-lg font-semibold text-primary-900">Who we are</h2>
          <p className="mt-2">
            Formulate is a platform of interactive clinical psychology tools and worksheets for use by qualified
            healthcare professionals. For data protection queries, contact privacy@formulate.app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">What data we collect</h2>
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-primary-800">Therapist account data</h3>
              <p className="mt-1">Email address, full name, organisation name (optional), subscription status, and usage data (which worksheets accessed, when, and frequency).</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-800">Client label data</h3>
              <p className="mt-1">Pseudonymised client labels (initials or case codes) assigned by the therapist. The platform enforces pseudonymity through validation. Formulate cannot identify clients from their labels.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-800">Worksheet response data</h3>
              <p className="mt-1">Clinical content entered by clients via homework links. This data is pseudonymous. Only the assigning therapist can view response data. Formulate does not access, review, analyse, or use response data for any purpose other than storage and display to the therapist.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-800">Technical data</h3>
              <p className="mt-1">IP addresses (for security), device and browser information (for compatibility), and strictly functional cookies (authentication session only). No analytics cookies, no advertising cookies, no third-party tracking.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Legal basis for processing</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-primary-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-primary-200 bg-primary-50">
                  <th className="px-3 py-2 text-left font-medium text-primary-600">Data type</th>
                  <th className="px-3 py-2 text-left font-medium text-primary-600">Legal basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                <tr><td className="px-3 py-2">Therapist account data</td><td className="px-3 py-2">Contract (Art. 6(1)(b))</td></tr>
                <tr><td className="px-3 py-2">Subscription/payment data</td><td className="px-3 py-2">Contract (Art. 6(1)(b))</td></tr>
                <tr><td className="px-3 py-2">Usage analytics</td><td className="px-3 py-2">Legitimate interests (Art. 6(1)(f))</td></tr>
                <tr><td className="px-3 py-2">Client labels</td><td className="px-3 py-2">Legitimate interests (Art. 6(1)(f))</td></tr>
                <tr><td className="px-3 py-2">Worksheet responses</td><td className="px-3 py-2">Legitimate interests as processor (Art. 6(1)(f))</td></tr>
                <tr><td className="px-3 py-2">Audit logs</td><td className="px-3 py-2">Legal obligation (Art. 6(1)(c)) + Legitimate interests</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Special category data</h2>
          <p className="mt-2">Worksheet response data may constitute health data under Article 9. Our legal basis is Article 9(2)(h) &mdash; processing necessary for health care provision under a health professional&apos;s responsibility.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Data sharing</h2>
          <p className="mt-2">We share data with Stripe (payment processing), Supabase (database hosting), and Vercel (application hosting). We do NOT sell data, share clinical data with third parties, use clinical data for advertising, or train AI models on worksheet responses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Data retention</h2>
          <p className="mt-2">Active account data is retained while the account is active plus 90 days after deletion request. Worksheet responses are retained while the therapeutic relationship is active. Therapists can permanently delete client data at any time via the GDPR erasure function. Audit logs are retained for 7 years.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Your rights</h2>
          <p className="mt-2">Under UK GDPR, you have the right to access, rectify, erase, restrict processing of, and port your data, and to object to processing. Contact privacy@formulate.app. We will respond within 30 days.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Client rights</h2>
          <p className="mt-2">Clients who complete homework worksheets can exercise their rights by contacting their therapist. The therapist can delete all data associated with a client using the platform&apos;s GDPR erasure function.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Cookies</h2>
          <p className="mt-2">Formulate uses only strictly necessary cookies for authentication session management. No cookie consent banner is required under UK PECR for strictly necessary cookies.</p>
        </section>
      </div>

      <div className="mt-12 border-t border-primary-100 pt-6">
        <Link href="/" className="text-sm text-primary-400 hover:text-primary-600 transition-colors">
          &larr; Back to Formulate
        </Link>
      </div>
    </main>
  )
}
