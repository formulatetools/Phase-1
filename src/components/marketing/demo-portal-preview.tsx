'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PortalTabs, type PortalTab } from '@/components/client-portal/portal-tabs'
import { ResourceCard } from '@/components/client-portal/resource-card'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  DEMO_ASSIGNMENTS,
  DEMO_PORTAL_WORKSHEETS,
  DEMO_RESOURCES,
  DEMO_SLUG_MAP,
} from '@/lib/demo-portal-data'

// ─── Demo Assignment Card ─────────────────────────────────────────────────
// Mirrors AssignmentCard styling but links to /hw/demo/[slug] and omits
// "View my responses" for completed items (no real response to view).

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function DemoAssignmentCard({
  assignment,
  variant,
}: {
  assignment: (typeof DEMO_ASSIGNMENTS)[number]
  variant: 'current' | 'completed'
}) {
  const worksheet = DEMO_PORTAL_WORKSHEETS.find(
    (w) => w.id === assignment.worksheet_id
  )
  const title = worksheet?.title || 'Worksheet'
  const slug = DEMO_SLUG_MAP[assignment.worksheet_id]
  const isCurrent = variant === 'current'

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm transition-colors hover:border-primary-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-primary-800">{title}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-primary-400 dark:text-primary-600">
            <span>Assigned {formatDate(assignment.assigned_at)}</span>
            {assignment.due_date && (
              <span>Due {formatDate(assignment.due_date)}</span>
            )}
            {assignment.completed_at && variant === 'completed' && (
              <span>Completed {formatDate(assignment.completed_at)}</span>
            )}
          </div>

          <div className="mt-2">
            {assignment.status === 'assigned' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary-500 dark:text-primary-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary-300 dark:border-primary-500"
                  aria-hidden="true"
                />
                Not started
              </span>
            )}
            {assignment.status === 'in_progress' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M6 1 A5 5 0 0 1 11 6" fill="currentColor" />
                </svg>
                In progress
              </span>
            )}
            {(assignment.status === 'completed' ||
              assignment.status === 'reviewed') && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {isCurrent && assignment.status === 'assigned' && slug && (
            <Link
              href={`/hw/demo/${slug}`}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 min-h-[44px]"
            >
              Open
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          )}
          {isCurrent && assignment.status === 'in_progress' && slug && (
            <Link
              href={`/hw/demo/${slug}`}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-900 dark:bg-brand dark:text-primary-900 dark:hover:bg-brand/90 min-h-[44px]"
            >
              Continue
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────

export function DemoPortalPreview() {
  const [activeTab, setActiveTab] = useState<PortalTab>('homework')

  const currentAssignments = DEMO_ASSIGNMENTS.filter(
    (a) => a.status === 'assigned' || a.status === 'in_progress'
  )
  const completedAssignments = DEMO_ASSIGNMENTS.filter(
    (a) => a.status === 'completed' || a.status === 'reviewed'
  )

  return (
    <div className="p-4 sm:p-6">
      {/* Heading */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-primary-900">
          Your Therapy Workspace
        </h2>
        <div className="mt-1.5 h-0.5 w-12 bg-brand" />
      </div>

      {/* Tabs */}
      <PortalTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        resourceCount={DEMO_RESOURCES.length}
      />

      {/* Homework tab */}
      {activeTab === 'homework' && (
        <div className="mt-5 space-y-5">
          {/* Current */}
          {currentAssignments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-primary-800">
                Current Homework
              </h3>
              <div className="mt-1 h-0.5 w-8 bg-brand" />
              <div className="mt-3 space-y-3">
                {currentAssignments.map((a) => (
                  <DemoAssignmentCard
                    key={a.id}
                    assignment={a}
                    variant="current"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedAssignments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-primary-800">
                Completed
              </h3>
              <div className="mt-1 h-0.5 w-8 bg-brand" />
              <div className="mt-3 space-y-3">
                {completedAssignments.map((a) => (
                  <DemoAssignmentCard
                    key={a.id}
                    assignment={a}
                    variant="completed"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Resources tab */}
      {activeTab === 'resources' && (
        <div className="mt-5 space-y-3">
          {DEMO_RESOURCES.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              portalToken="demo"
              appUrl=""
            />
          ))}
        </div>
      )}

      {/* Signup CTA */}
      <div className="mt-8 border-t border-primary-100 pt-6 text-center">
        <p className="text-sm font-medium text-primary-700">
          This is what your clients see. Set it up in under a minute.
        </p>
        <Link
          href="/signup"
          className={`mt-3 inline-flex ${buttonVariants.accent('md')}`}
        >
          Get Started Free
        </Link>
      </div>
    </div>
  )
}
