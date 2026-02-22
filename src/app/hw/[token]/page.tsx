import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { WorksheetAssignment, Worksheet, WorksheetResponse } from '@/types/database'
import { HomeworkForm } from '@/components/homework/homework-form'
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

  // Fetch existing response (if any)
  const { data: existingResponse } = await supabase
    .from('worksheet_responses')
    .select('*')
    .eq('assignment_id', typedAssignment.id)
    .is('deleted_at', null)
    .single()

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
      <header className="border-b border-primary-100 bg-white">
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

        {readOnly && (
          <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-600 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            This worksheet has been submitted and reviewed. It is now read-only.
          </div>
        )}

        <HomeworkForm
          token={token}
          schema={typedWorksheet.schema}
          existingResponse={existingResponse ? (existingResponse as WorksheetResponse).response_data as Record<string, unknown> : undefined}
          isCompleted={isCompleted}
          readOnly={readOnly}
        />
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
