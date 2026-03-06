import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security',
  description:
    'How Formulate protects your clinical data — encryption, access control, GDPR compliance, and responsible AI.',
  openGraph: {
    title: 'Security — Formulate',
    description: 'How Formulate protects your clinical data — encryption, access control, GDPR compliance, and responsible AI.',
  },
  alternates: {
    canonical: '/security',
  },
}

const sections = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Encryption & Infrastructure',
    description:
      'All data is encrypted at rest using AES-256 and in transit using TLS 1.2+. Our database is hosted on Supabase (AWS eu-west-2, London region), ensuring data residency within the UK.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Access Control',
    description:
      'Row-level security (RLS) is enforced at the database level. Every query is scoped to the authenticated therapist — one practitioner can never access another\'s client data, even through direct API calls.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 9.75c0 .746-.092 1.472-.264 2.165m-15.472 0A8.96 8.96 0 005.25 9.75c0-.746.092-1.472.264-2.165m0 0A11.952 11.952 0 0112 10.5c2.998 0 5.74-1.1 7.843-2.918" />
      </svg>
    ),
    title: 'GDPR Compliance',
    description:
      'Clients are identified by pseudonymous labels (initials or codes), never by full name or email. Every client has a secure data portal where they can view their submitted responses and request deletion under GDPR Article 17. Deleted data is purged permanently after a 90-day retention window.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'AI Data Handling',
    description:
      'Before any text is sent to our AI for worksheet generation, it passes through a PII stripping process that detects and replaces email addresses, phone numbers, NHS numbers, postcodes, and names with safe placeholders. Your data is never used to train AI models.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: 'Content Security Policy',
    description:
      'Every page response includes a strict Content Security Policy with per-request nonces. Inline scripts are only executed when signed with a valid nonce, preventing cross-site scripting (XSS) attacks.',
  },
]

const subprocessors = [
  { name: 'Supabase', purpose: 'Database, authentication & file storage', location: 'EU (London)' },
  { name: 'Stripe', purpose: 'Payment processing', location: 'US / EU' },
  { name: 'Resend', purpose: 'Transactional email', location: 'US' },
  { name: 'Anthropic', purpose: 'AI worksheet generation', location: 'US' },
  { name: 'Vercel', purpose: 'Application hosting & CDN', location: 'Global edge' },
  { name: 'Sentry', purpose: 'Error monitoring', location: 'US' },
]

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
          Security & Privacy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-500">
          Formulate is designed from the ground up to protect clinical data.
          Here&apos;s how we keep your practice and your clients safe.
        </p>
      </div>

      {/* Security sections */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              {section.icon}
            </div>
            <h2 className="mt-4 text-base font-semibold text-primary-900">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-600">
              {section.description}
            </p>
          </div>
        ))}
      </div>

      {/* Subprocessors */}
      <div className="mt-16">
        <h2 className="text-center text-xl font-bold text-primary-900">
          Subprocessors
        </h2>
        <p className="mt-2 text-center text-sm text-primary-500">
          Third-party services that process data on our behalf.
        </p>
        <div className="mt-8 overflow-hidden rounded-xl border border-primary-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-100 bg-primary-50/50">
                <th className="px-4 py-3 text-left font-medium text-primary-700">
                  Service
                </th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">
                  Purpose
                </th>
                <th className="px-4 py-3 text-left font-medium text-primary-700">
                  Data Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {subprocessors.map((sp) => (
                <tr key={sp.name}>
                  <td className="px-4 py-3 font-medium text-primary-900">
                    {sp.name}
                  </td>
                  <td className="px-4 py-3 text-primary-600">{sp.purpose}</td>
                  <td className="px-4 py-3 text-primary-500">{sp.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact */}
      <div className="mt-16 rounded-xl border border-primary-100 bg-primary-50 p-6 text-center">
        <p className="text-sm font-medium text-primary-700">
          Have a security concern?
        </p>
        <p className="mt-1 text-sm text-primary-500">
          Contact us at{' '}
          <a
            href="mailto:hello@formulatetools.co.uk"
            className="font-medium text-brand underline decoration-brand/30 hover:decoration-brand"
          >
            hello@formulatetools.co.uk
          </a>
        </p>
      </div>
    </main>
  )
}
