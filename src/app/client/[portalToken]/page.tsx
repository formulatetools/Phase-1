import dynamic from 'next/dynamic'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
} from '@/types/database'
import { LogoIcon } from '@/components/ui/logo'

const ClientPortal = dynamic(
  () => import('@/components/client-portal/client-portal').then((m) => m.ClientPortal),
  { ssr: false }
)

export const metadata = {
  title: 'My Data — Formulate',
  robots: 'noindex, nofollow',
}

interface PageProps {
  params: Promise<{ portalToken: string }>
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { portalToken } = await params
  const supabase = createServiceClient()

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

  // 1. Look up relationship by portal token (select only needed fields)
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, therapist_id, client_label')
    .eq('client_portal_token', portalToken)
    .is('deleted_at', null)
    .single()

  if (!relationship) notFound()

  const typedRelationship = relationship as Pick<TherapeuticRelationship, 'id' | 'therapist_id' | 'client_label'>

  // 2. Fetch all assignments for this relationship (ordered by date desc)
  const { data: assignmentsData } = await supabase
    .from('worksheet_assignments')
    .select('id, token, status, worksheet_id, assigned_at, due_date, expires_at, completed_at, withdrawn_at, completion_method')
    .eq('relationship_id', typedRelationship.id)
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

  const therapistName = (therapistProfile as { full_name: string | null } | null)?.full_name || 'your therapist'

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-t-[3px] border-t-brand border-b border-b-primary-100 bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-primary-800">Formulate</span>
          </div>
          <span className="text-xs text-primary-400">My Data</span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ClientPortal
          portalToken={portalToken}
          clientLabel={typedRelationship.client_label}
          therapistName={therapistName}
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
            completion_method: a.completion_method,
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
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary-400">
          <LogoIcon size={12} />
          <span>Powered by Formulate · <a href="https://formulatetools.co.uk" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary-500 transition-colors">formulatetools.co.uk</a></span>
        </div>
        <p className="mt-2 text-xs text-primary-300">
          <a href="/privacy" className="underline hover:text-primary-500">Privacy Policy</a>
          {' · '}
          <a href="/terms" className="underline hover:text-primary-500">Terms of Use</a>
        </p>
      </footer>
    </div>
  )
}
