import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'

export const metadata = {
  title: 'Terms of Service — Formulate',
  description: 'Terms of Service for the Formulate clinical tools platform.',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon size={24} />
          <span className="text-lg font-semibold text-primary-800">formulate</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-primary-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-primary-400">Draft — last updated February 2026. These terms require legal drafting before formal publication.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-primary-700">
        <section>
          <h2 className="text-lg font-semibold text-primary-900">Service description</h2>
          <p className="mt-2">
            Formulate provides a platform of interactive clinical psychology tools and worksheets for use by
            qualified healthcare professionals in the course of their clinical practice. Formulate is a tool
            platform. It does not provide clinical advice, therapy, supervision, or diagnosis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Clinical responsibility</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Formulate provides tools; clinical decisions remain the sole responsibility of the registered practitioner.</li>
            <li>The therapist is responsible for determining the appropriateness of any tool for their client.</li>
            <li>Formulate does not validate, review, or quality-assure clinical content entered by users or clients.</li>
            <li>Computed fields (e.g. belief change calculations, average scores) are mathematical calculations, not clinical assessments.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Data controller responsibilities</h2>
          <p className="mt-2">
            When a therapist assigns homework to a client via Formulate, the therapist is the data controller for the
            clinical content. Formulate processes this data as a data processor under the therapist&apos;s instruction. The
            therapist is responsible for obtaining any necessary consent from their client and managing data subject
            access requests.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Acceptable use</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Client labels must not contain identifiable client information. The platform will reject obvious PII but therapists must exercise professional judgment.</li>
            <li>Worksheet response content is the therapist&apos;s clinical responsibility. Formulate does not monitor or moderate content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Liability limitations</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Formulate is not liable for clinical outcomes arising from the use of its tools.</li>
            <li>Formulate is not a crisis service. Safety plan worksheets should be completed in session with a clinician.</li>
            <li>Service availability is provided on a best-efforts basis. Therapists should not rely on Formulate as the sole repository for critical clinical information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Subscription and cancellation</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>On cancellation, your account reverts to the free tier. Existing data is retained for 90 days, then permanently deleted (with email warning at 60 days).</li>
            <li>You can export or permanently delete your data at any time while the account is active.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Intellectual property</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Curated worksheet schemas are Formulate&apos;s intellectual property, licensed for clinical use.</li>
            <li>Custom worksheets created by therapists remain the therapist&apos;s intellectual property.</li>
            <li>Clinical content entered by users/clients belongs to the therapist as data controller.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-900">Contact</h2>
          <p className="mt-2">For questions about these terms, contact privacy@formulate.app.</p>
        </section>
      </div>

      <div className="mt-12 border-t border-primary-100 pt-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-primary-400 hover:text-primary-600 transition-colors">
          &larr; Back to Formulate
        </Link>
        <Link href="/privacy" className="text-sm text-primary-400 hover:text-primary-600 transition-colors">
          Privacy Policy &rarr;
        </Link>
      </div>
    </main>
  )
}
