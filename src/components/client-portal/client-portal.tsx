'use client'

import { useState, useEffect } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { PortalConsent } from './portal-consent'
import { AssignmentCard } from './assignment-card'
import { ProgressSection } from './progress-section'
import { BookmarkBanner } from './bookmark-banner'
import { PwaInstallBanner } from './pwa-install-banner'
import { PortalTabs, type PortalTab } from './portal-tabs'
import { ResourceCard, type PortalResource } from './resource-card'

// ─── Types ───────────────────────────────────────────────────────

export interface PortalAssignment {
  id: string
  token: string
  status: string
  worksheet_id: string
  assigned_at: string
  due_date: string | null
  expires_at: string
  completed_at: string | null
}

export interface PortalResponse {
  id: string
  assignment_id: string
  response_data: Record<string, unknown>
  completed_at: string | null
}

export interface PortalWorksheet {
  id: string
  title: string
  description: string
  schema: WorksheetSchema
}

interface ClientPortalProps {
  portalToken: string
  clientLabel: string
  therapistName: string
  hasConsented: boolean
  assignments: PortalAssignment[]
  responses: PortalResponse[]
  worksheets: PortalWorksheet[]
  resources: PortalResource[]
  appUrl: string
  completedCount: number
  weeksActive: number
}

// ─── Component ───────────────────────────────────────────────────

export function ClientPortal({
  portalToken,
  hasConsented: initialConsented,
  assignments,
  responses,
  worksheets,
  resources,
  appUrl,
  completedCount,
  weeksActive,
}: ClientPortalProps) {
  const [consented, setConsented] = useState(initialConsented)
  const [activeTab, setActiveTab] = useState<PortalTab>('homework')

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))
  const responseMap = new Map(responses.map((r) => [r.assignment_id, r]))

  // Register service worker after consent
  useEffect(() => {
    if (consented && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/portal-sw.js', { scope: '/client/' }).catch(() => {
        // Service worker registration failed — not critical
      })
    }
  }, [consented])

  // ─── State A: Not consented ────────────────────────────────────
  if (!consented) {
    return (
      <PortalConsent
        portalToken={portalToken}
        onConsented={() => setConsented(true)}
      />
    )
  }

  // ─── Split assignments into sections ───────────────────────────
  const currentAssignments = assignments
    .filter((a) => a.status === 'assigned' || a.status === 'in_progress')
    .sort((a, b) => {
      // Sort by due date ascending (nulls last), then assigned date
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (a.due_date && !b.due_date) return -1
      if (!a.due_date && b.due_date) return 1
      return new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime()
    })

  const completedAssignments = assignments
    .filter((a) => a.status === 'completed' || a.status === 'reviewed')
    .filter((a) => responseMap.has(a.id)) // Only show if they have a response to view
    .sort((a, b) => {
      // Sort by completed date descending
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return dateB - dateA
    })

  // ─── State C: Consented but no assignments ─────────────────────
  if (assignments.length === 0 && resources.length === 0) {
    return (
      <div className="space-y-4">
        <BookmarkBanner />
        <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <svg className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-primary-600">
            Nothing here yet.
          </p>
          <p className="mt-1 text-xs text-primary-400">
            When your therapist assigns homework or shares resources, they will appear here.
          </p>
        </div>
      </div>
    )
  }

  // ─── State B: Consented with content ────────────────────────────
  return (
    <div className="space-y-6">
      {/* Banners */}
      <BookmarkBanner />
      <PwaInstallBanner />

      {/* Tabs — only show when there are resources to switch between */}
      {resources.length > 0 && (
        <PortalTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          resourceCount={resources.length}
        />
      )}

      {/* Homework Tab (default) */}
      {activeTab === 'homework' && (
        <>
          {/* Current Homework */}
          {currentAssignments.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-primary-800">Current Homework</h2>
              <div className="mt-1 h-0.5 w-8 bg-brand" />
              <div className="mt-4 space-y-3">
                {currentAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    worksheet={worksheetMap.get(a.worksheet_id)}
                    portalToken={portalToken}
                    appUrl={appUrl}
                    variant="current"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedAssignments.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-primary-800">Completed</h2>
              <div className="mt-1 h-0.5 w-8 bg-brand" />
              <div className="mt-4 space-y-3">
                {completedAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    worksheet={worksheetMap.get(a.worksheet_id)}
                    portalToken={portalToken}
                    appUrl={appUrl}
                    variant="completed"
                  />
                ))}
              </div>
            </section>
          )}

          {/* No assignments empty state (but resources exist, so tabs are visible) */}
          {assignments.length === 0 && resources.length > 0 && (
            <div className="rounded-2xl border border-dashed border-primary-200 p-6 text-center">
              <p className="text-sm text-primary-500">No homework assigned yet.</p>
              <p className="mt-1 text-xs text-primary-400">
                When your therapist assigns a worksheet, it will appear here.
              </p>
            </div>
          )}

          {/* Progress */}
          {(currentAssignments.length > 0 || completedAssignments.length > 0) && (
            <ProgressSection
              completedCount={completedCount}
              weeksActive={weeksActive}
            />
          )}
        </>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <>
          {resources.length > 0 ? (
            <div className="space-y-3">
              {resources.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  portalToken={portalToken}
                  appUrl={appUrl}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary-200 p-6 text-center">
              <p className="text-sm text-primary-500">No resources shared yet.</p>
              <p className="mt-1 text-xs text-primary-400">
                Your therapist can share helpful links and articles here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
