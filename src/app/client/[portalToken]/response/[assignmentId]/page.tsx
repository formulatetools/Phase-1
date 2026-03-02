import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type {
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
} from '@/types/database'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { ResponseViewer } from '@/components/client-portal/response-viewer'

interface PageProps {
  params: Promise<{ portalToken: string; assignmentId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Your Response — Formulate',
    robots: 'noindex, nofollow',
  }
}

export default async function ResponseViewerPage({ params }: PageProps) {
  const { portalToken, assignmentId } = await params
  const supabase = createServiceClient()

  // 1. Look up relationship by portal token
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id, therapist_id, client_label, portal_consented_at')
    .eq('client_portal_token', portalToken)
    .is('deleted_at', null)
    .single()

  if (!relationship) notFound()

  // Must have consented to view responses
  if (!relationship.portal_consented_at) notFound()

  // 2. Verify assignment belongs to this relationship
  const { data: assignment } = await supabase
    .from('worksheet_assignments')
    .select('id, worksheet_id, status, assigned_at, completed_at')
    .eq('id', assignmentId)
    .eq('relationship_id', relationship.id)
    .is('deleted_at', null)
    .single()

  if (!assignment) notFound()

  const typedAssignment = assignment as Pick<
    WorksheetAssignment,
    'id' | 'worksheet_id' | 'status' | 'assigned_at' | 'completed_at'
  >

  // Only show completed/reviewed assignments
  if (
    typedAssignment.status !== 'completed' &&
    typedAssignment.status !== 'reviewed'
  ) {
    notFound()
  }

  // 3. Fetch response
  const { data: response } = await supabase
    .from('worksheet_responses')
    .select('id, assignment_id, response_data, completed_at')
    .eq('assignment_id', assignmentId)
    .is('deleted_at', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (!response) notFound()

  const typedResponse = response as Pick<
    WorksheetResponse,
    'id' | 'assignment_id' | 'response_data' | 'completed_at'
  >

  // 4. Fetch worksheet schema
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, title, description, schema')
    .eq('id', typedAssignment.worksheet_id)
    .single()

  if (!worksheet) notFound()

  const typedWorksheet = worksheet as Pick<
    Worksheet,
    'id' | 'title' | 'description' | 'schema'
  >

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
          className="inline-flex items-center gap-1 text-sm text-primary-500 dark:text-primary-600 hover:text-primary-700 transition-colors mb-6"
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

        {/* Worksheet title + completed date */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary-900">
            {typedWorksheet.title}
          </h1>
          <div className="mt-1.5 h-0.5 w-12 bg-brand" />
          {typedResponse.completed_at && (
            <p className="mt-2 text-xs text-primary-400 dark:text-primary-600">
              Completed{' '}
              {new Date(typedResponse.completed_at).toLocaleDateString(
                'en-GB',
                {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </p>
          )}
        </div>

        {/* Response viewer (client component) */}
        <ResponseViewer
          schema={typedWorksheet.schema}
          responseData={typedResponse.response_data}
          portalToken={portalToken}
          assignmentId={assignmentId}
          worksheetTitle={typedWorksheet.title}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary-400 dark:text-primary-600">
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
