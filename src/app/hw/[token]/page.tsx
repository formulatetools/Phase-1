import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { WorksheetAssignment, Worksheet, WorksheetResponse } from '@/types/database'
import { HomeworkForm } from '@/components/homework/homework-form'
import { ConsentGate } from '@/components/homework/consent-gate'
import { LogoIcon } from '@/components/ui/logo'
import { generatePortalToken } from '@/lib/tokens'
import { isValidPreviewHash } from '@/lib/preview'

export const metadata = {
  title: 'Homework — Formulate',
  robots: 'noindex, nofollow', // Don't index homework pages
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ preview?: string }>
}

export default async function HomeworkPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { preview: previewHash } = await searchParams
  const supabase = createServiceClient()

  // Detect preview mode via signed hash
  const isPreview = !!previewHash && isValidPreviewHash(token, previewHash)

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
  // Skip consent check for previews — therapist doesn't need to consent
  const hasConsent = isPreview
    ? true
    : !!(await supabase
        .from('homework_consent')
        .select('id')
        .eq('relationship_id', typedAssignment.relationship_id)
        .eq('consent_type', 'homework_digital_completion')
        .is('withdrawn_at', null)
        .single()
      ).data

  // Fetch client portal token for linking to the data portal
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('client_portal_token')
    .eq('id', typedAssignment.relationship_id)
    .is('deleted_at', null)
    .single()

  // Auto-generate portal token if missing (backfills older relationships)
  // Skip for previews — don't trigger side effects
  let portalToken = relationship?.client_portal_token
  if (!isPreview && relationship && !portalToken) {
    portalToken = generatePortalToken()
    await supabase
      .from('therapeutic_relationships')
      .update({ client_portal_token: portalToken })
      .eq('id', typedAssignment.relationship_id)
  }

  const portalUrl = portalToken ? `/client/${portalToken}` : null

  // Determine state
  // For preview: skip expiry check (spec: "No expiry check for previews")
  const isExpired = !isPreview && new Date(typedAssignment.expires_at) < new Date()
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

  // Preview content — ConsentGate is skipped, form is disabled
  const mainContent = (
    <>
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

      {readOnly && !isPreview && (
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
        existingResponse={!isPreview && existingResponse ? (existingResponse as WorksheetResponse).response_data as Record<string, unknown> : undefined}
        isCompleted={isPreview ? false : isCompleted}
        readOnly={isPreview ? false : readOnly}
        isPreview={isPreview}
        worksheetTitle={typedWorksheet.title}
        worksheetDescription={typedWorksheet.description}
        worksheetInstructions={typedWorksheet.instructions}
        portalUrl={isPreview ? null : portalUrl}
      />
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Preview banner */}
      {isPreview && (
        <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-3 text-center">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              You&apos;re previewing this as your client will see it. Any data entered here won&apos;t be saved.
            </p>
          </div>
        </div>
      )}

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

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {isPreview ? (
          // Preview mode: skip ConsentGate entirely
          mainContent
        ) : (
          // Normal mode: wrap in ConsentGate
          <ConsentGate
            token={token}
            initialHasConsent={hasConsent}
            worksheetTitle={typedWorksheet.title}
            worksheetSchema={typedWorksheet.schema}
          >
            {mainContent}
          </ConsentGate>
        )}
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
