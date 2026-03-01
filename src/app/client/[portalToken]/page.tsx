import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
} from '@/types/database'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { ClientPortal } from '@/components/client-portal/client-portal'

interface PageProps {
  params: Promise<{ portalToken: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { portalToken } = await params
  return {
    title: 'My Therapy Workspace — Formulate',
    robots: 'noindex, nofollow',
    manifest: `/api/client-portal/manifest?token=${portalToken}`,
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'Therapy',
    },
    icons: {
      apple: '/icon-192.png',
    },
  }
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { portalToken } = await params
  const supabase = createServiceClient()

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

  // 1. Look up relationship by portal token (include consent fields)
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, therapist_id, client_label, portal_consented_at')
    .eq('client_portal_token', portalToken)
    .is('deleted_at', null)
    .single()

  if (!relationship) notFound()

  const typedRelationship = relationship as Pick<
    TherapeuticRelationship,
    'id' | 'therapist_id' | 'client_label' | 'portal_consented_at'
  >

  const hasConsented = !!typedRelationship.portal_consented_at

  // 2. Fetch all non-withdrawn assignments for this relationship
  const { data: assignmentsData } = await supabase
    .from('worksheet_assignments')
    .select('id, token, status, worksheet_id, assigned_at, due_date, expires_at, completed_at')
    .eq('relationship_id', typedRelationship.id)
    .neq('status', 'withdrawn')
    .is('deleted_at', null)
    .order('assigned_at', { ascending: false })

  const assignments = (assignmentsData || []) as WorksheetAssignment[]

  // 3. Fetch all responses for those assignments
  const assignmentIds = assignments.map((a) => a.id)
  let responses: WorksheetResponse[] = []
  if (assignmentIds.length > 0) {
    const { data: responsesData } = await supabase
      .from('worksheet_responses')
      .select('id, assignment_id, response_data, completed_at')
      .in('assignment_id', assignmentIds)
      .is('deleted_at', null)

    responses = (responsesData || []) as WorksheetResponse[]
  }

  // 4. Fetch worksheet metadata
  const worksheetIds = [...new Set(assignments.map((a) => a.worksheet_id))]
  let worksheets: Worksheet[] = []
  if (worksheetIds.length > 0) {
    const { data: worksheetsData } = await supabase
      .from('worksheets')
      .select('id, title, description, schema')
      .in('id', worksheetIds)

    worksheets = (worksheetsData || []) as Worksheet[]
  }

  // 5. Fetch therapist name
  const { data: therapistProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', typedRelationship.therapist_id)
    .single()

  const therapistName =
    (therapistProfile as { full_name: string | null } | null)?.full_name ||
    'your therapist'

  // 6. Compute progress stats
  const completedCount = assignments.filter(
    (a) => a.status === 'completed' || a.status === 'reviewed'
  ).length

  const firstAssignment =
    assignments.length > 0
      ? assignments.reduce((earliest, a) =>
          new Date(a.assigned_at) < new Date(earliest.assigned_at)
            ? a
            : earliest
        )
      : null

  const weeksActive = firstAssignment
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(firstAssignment.assigned_at).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      )
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-t-[3px] border-t-brand border-b border-b-primary-100 bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-primary-800">
              Formulate
            </span>
          </div>
          {hasConsented && (
            <Link
              href={`/client/${portalToken}/data`}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage my data
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {hasConsented && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-primary-900">
              Your Therapy Workspace
            </h1>
            <div className="mt-1.5 h-0.5 w-12 bg-brand" />
          </div>
        )}

        <ClientPortal
          portalToken={portalToken}
          clientLabel={typedRelationship.client_label}
          therapistName={therapistName}
          hasConsented={hasConsented}
          assignments={assignments.map((a) => ({
            id: a.id,
            token: a.token,
            status: a.status,
            worksheet_id: a.worksheet_id,
            assigned_at: a.assigned_at,
            due_date: a.due_date,
            expires_at: a.expires_at,
            completed_at: a.completed_at,
          }))}
          responses={responses.map((r) => ({
            id: r.id,
            assignment_id: r.assignment_id,
            response_data: r.response_data,
            completed_at: r.completed_at,
          }))}
          worksheets={worksheets.map((w) => ({
            id: w.id,
            title: w.title,
            description: w.description,
            schema: w.schema,
          }))}
          appUrl={APP_URL}
          completedCount={completedCount}
          weeksActive={weeksActive}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary-400">
          <LogoIcon size={12} />
          <span>
            Powered by Formulate ·{' '}
            <a
              href="https://formulatetools.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary-500 transition-colors"
            >
              formulatetools.co.uk
            </a>
          </span>
        </div>
        <p className="mt-2 text-xs text-primary-300">
          <a href="/privacy" className="underline hover:text-primary-500">
            Privacy Policy
          </a>
          {' · '}
          <a href="/terms" className="underline hover:text-primary-500">
            Terms of Use
          </a>
        </p>
        <p className="mt-3 text-[10px] text-primary-300">
          This link is private to you. Don&apos;t share it with anyone other
          than your therapist.
        </p>
      </footer>
    </div>
  )
}
