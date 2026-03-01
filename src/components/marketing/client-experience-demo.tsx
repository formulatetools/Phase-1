import Link from 'next/link'
import { DEMO_WORKSHEETS } from '@/lib/demo-data'

const ICONS: Record<string, React.ReactNode> = {
  'thought-record': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  hierarchy: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  ),
  schedule: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
}

interface ClientExperienceDemoProps {
  /** When shown on a worksheet page, highlight the current worksheet's slug */
  currentSlug?: string
  /** Compact mode for embedding in worksheet detail pages */
  compact?: boolean
}

export function ClientExperienceDemo({ currentSlug, compact = false }: ClientExperienceDemoProps) {
  return (
    <div className={compact ? '' : 'mx-auto max-w-4xl'}>
      {!compact && (
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-primary-900 sm:text-3xl">
            See the client experience
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-500">
            Try the exact same interface your clients use — consent screen,
            interactive form, and all. Pre-filled with realistic examples you can
            clear and fill in yourself.
          </p>
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
        {DEMO_WORKSHEETS.map((ws) => {
          const isCurrent = ws.slug === currentSlug

          return (
            <Link
              key={ws.slug}
              href={`/hw/demo/${ws.slug}`}
              className={`group relative rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isCurrent
                  ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                  : 'border-primary-200 bg-surface hover:border-brand/30'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                  This worksheet
                </span>
              )}

              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isCurrent ? 'bg-brand/20 text-brand' : 'bg-primary-100 text-primary-500 group-hover:bg-brand/10 group-hover:text-brand'
              } transition-colors`}>
                {ICONS[ws.icon]}
              </div>

              <h3 className="mt-3 text-sm font-semibold text-primary-900">
                {ws.title}
              </h3>
              <p className="mt-1 text-xs text-primary-500 leading-relaxed">
                {ws.description}
              </p>

              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand group-hover:text-brand-dark transition-colors">
                Try it
                <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
