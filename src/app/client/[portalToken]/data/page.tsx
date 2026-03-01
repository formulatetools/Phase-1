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
import { DataManagement } from '@/components/client-portal/data-management'
import { isSessionValid } from '@/lib/utils/portal-session'
import { PinEntry } from '@/components/client-portal/pin-entry'

interface PageProps {
  params: Promise<{ portalToken: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Manage Your Data — Formulate',
    robots: 'noindex, nofollow',
  }
}

export default async function DataManagementPage({ params }: PageProps) {
  const { portalToken } = await params
  const supabase = createServiceClient()

  // 1. Look up relationship by portal token
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, therapist_id, client_label, portal_consented_at, portal_pin_hash, portal_pin_set_at')
    .eq('client_portal_token', portalToken)
    .is('deleted_at', null)
    .single()

  if (!relationship) notFound()

  const typedRelationship = relationship as Pick<
    TherapeuticRelationship,
    'id' | 'therapist_id' | 'client_label' | 'portal_consented_at' | 'portal_pin_hash' | 'portal_pin_set_at'
  >

  // Must have consented to access data management
  if (!typedRelationship.portal_consented_at) notFound()

  // PIN check — if PIN is set, verify session cookie
  const hasPinSet = !!typedRelationship.portal_pin_hash
  if (hasPinSet) {
    const pinValid = await isSessionValid(typedRelationship.id)
    if (!pinValid) {
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'
      return (
        <div className="min-h-screen bg-background">
          <header className="border-t-[3px] border-t-brand border-b border-b-primary-100 bg-surface">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <LogoIcon size={20} />
                <span className="text-sm font-semibold text-primary-800">Formulate</span>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 py-8">
            <PinEntry portalToken={portalToken} appUrl={APP_URL} />
          </main>
        </div>
      )
    }
  }

  // 2. Fetch all non-withdrawn assignments
  const { data: assignmentsData } = await supabase
    .from('worksheet_assignments')
    .select(
      'id, token, status, worksheet_id, assigned_at, due_date, expires_at, completed_at, withdrawn_at'
    )
    .eq('relationship_id', typedRelationship.id)
    .is('deleted_at', null)
    .order('assigned_at', { ascending: false })

  const assignments = (assignmentsData || []) as WorksheetAssignment[]

  // 3. Fetch all responses
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
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href={`/client/${portalToken}`}
          className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-700 transition-colors mb-6"
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to workspace
        </Link>

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary-900">
            Manage Your Data
          </h1>
          <div className="mt-1.5 h-0.5 w-12 bg-brand" />
          <p className="mt-3 text-sm text-primary-500">
            View, download, or delete your homework data. All changes are
            permanent and your therapist ({therapistName}) will be notified of
            any deletions.
          </p>
        </div>

        <DataManagement
          portalToken={portalToken}
          hasPinSet={hasPinSet}
          pinSetAt={typedRelationship.portal_pin_set_at || null}
          appUrl={process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'}
          assignments={assignments.map((a) => ({
            id: a.id,
            token: a.token,
            status: a.status,
            worksheet_id: a.worksheet_id,
            assigned_at: a.assigned_at,
            due_date: a.due_date,
            expires_at: a.expires_at,
            completed_at: a.completed_at,
            withdrawn_at: a.withdrawn_at,
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
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary-400">
          <LogoIcon size={12} />
          <span>
            Powered by Formulate &middot;{' '}
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
      </footer>
    </div>
  )
}
