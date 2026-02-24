import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { WorksheetAssignment, Worksheet, WorksheetResponse } from '@/types/database'
import { HomeworkForm } from '@/components/homework/homework-form'
import { ConsentGate } from '@/components/homework/consent-gate'
import { LogoIcon } from '@/components/ui/logo'

export const metadata = {
  title: 'Homework — Formulate',
  robots: 'noindex, nofollow', // Don't index homework pages
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function HomeworkPage({ params }: PageProps) {
  const { token } = await params
  const supabase = createServiceClient()

  // Look up assignment by token
  const { data: assignment } = await supabase
    .from('worksheet_assignments')
    .select('*')
    .eq('token', token)
    .is('deleted_at', null)
    .single()

  if (!assignment) notFound()

  const typedAssignment = assignment as WorksheetAssignment

  // Fetch the worksheet
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('*')
    .eq('id', typedAssignment.worksheet_id)
    .single()

  if (!worksheet) notFound()

  const typedWorksheet = worksheet as Worksheet

  // Detect if this is a safety plan worksheet
  const isSafetyPlan = typedWorksheet.schema?.layout === 'safety_plan'

  // Detect custom (non-curated) worksheets — curated ones are published by admins
  // Custom worksheets will have a therapist_id once the custom builder ships
  const isCurated = typedWorksheet.is_published

  // Fetch existing response (if any)
  const { data: existingResponse } = await supabase
    .from('worksheet_responses')
    .select('*')
    .eq('assignment_id', typedAssignment.id)
    .is('deleted_at', null)
    .single()

  // Check for existing consent (server-side, avoids flash for returning users)
  const { data: existingConsent } = await supabase
    .from('homework_consent')
    .select('id')
    .eq('relationship_id', typedAssignment.relationship_id)
    .eq('consent_type', 'homework_digital_completion')
    .is('withdrawn_at', null)
    .single()

  const hasConsent = !!existingConsent

  // Fetch client portal token for linking to the data portal
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('client_portal_token')
    .eq('id', typedAssignment.relationship_id)
    .is('deleted_at', null)
    .single()

  const portalUrl = relationship?.client_portal_token
    ? `/client/${relationship.client_portal_token}`
    : null

  // Determine state
  const isExpired = new Date(typedAssignment.expires_at) < new Date()
  const isLocked = !!typedAssignment.locked_at
  const isCompleted = typedAssignment.status === 'completed' || typedAssignment.status === 'reviewed'

  // Expired page
  if (isExpired && !isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-primary-900">This link has expired</h1>
          <p className="mt-2 text-sm text-primary-500">
            This homework assignment link is no longer active. Please contact your therapist for a new link.
          </p>
          {portalUrl && (
            <a
              href={portalUrl}
              className="mt-4 inline-block rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              View your data
            </a>
          )}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-primary-400">
            <LogoIcon size={14} />
            <span>Formulate</span>
          </div>
        </div>
      </div>
    )
  }

  // Read-only view (completed + locked)
  const readOnly = isLocked || (isCompleted && isLocked)

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-primary-100 bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-primary-800">Formulate</span>
          </div>
          {typedAssignment.due_date && (
            <span className="text-xs text-primary-400">
              Due {new Date(typedAssignment.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </header>

      {/* Main content — wrapped in ConsentGate */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ConsentGate
          token={token}
          initialHasConsent={hasConsent}
          worksheetTitle={typedWorksheet.title}
          worksheetSchema={typedWorksheet.schema}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary-900">{typedWorksheet.title}</h1>
            {typedWorksheet.description && (
              <p className="mt-2 text-sm text-primary-500">{typedWorksheet.description}</p>
            )}
            {typedWorksheet.instructions && (
              <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm text-primary-700">
                {typedWorksheet.instructions}
              </div>
            )}
          </div>

          {/* Custom worksheet disclaimer — non-curated tools */}
          {!isCurated && (
            <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-600">
              This worksheet was created by your therapist, not by Formulate.
              Formulate does not review or validate custom clinical content.
            </div>
          )}

          {/* Safety plan crisis disclaimer */}
          {isSafetyPlan && (
            <div className="mb-6 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
              <p className="text-sm text-primary-700">
                <strong>Important:</strong> This safety plan is designed to be completed with your therapist.
                If you are in immediate danger or experiencing a mental health crisis, please contact:{' '}
                <strong>999</strong> (emergency),{' '}
                <strong>116 123</strong> (Samaritans, 24/7), or{' '}
                <strong>0800 689 5555</strong> (SANEline, 4:30pm–10:30pm).
                This worksheet is not a crisis service.
              </p>
            </div>
          )}

          {readOnly && (
            <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-600 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="flex-1">This worksheet has been submitted and reviewed. It is now read-only.</span>
              {portalUrl && (
                <a
                  href={portalUrl}
                  className="shrink-0 text-xs font-medium text-primary-600 underline underline-offset-2 hover:text-primary-800 transition-colors"
                >
                  View all your data
                </a>
              )}
            </div>
          )}

          <HomeworkForm
            token={token}
            schema={typedWorksheet.schema}
            existingResponse={existingResponse ? (existingResponse as WorksheetResponse).response_data as Record<string, unknown> : undefined}
            isCompleted={isCompleted}
            readOnly={readOnly}
            worksheetTitle={typedWorksheet.title}
            portalUrl={portalUrl}
          />
        </ConsentGate>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary-400">
          <LogoIcon size={12} />
          <span>Powered by Formulate</span>
        </div>
      </footer>
    </div>
  )
}
