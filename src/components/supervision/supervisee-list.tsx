'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TherapeuticRelationship, SubscriptionTier } from '@/types/database'
import { createSupervisee, endSupervision, reactivateSupervisee } from '@/app/(dashboard)/supervision/actions'
import { validateSuperviseeLabel } from '@/lib/validation/supervisee-label'

interface SuperviseeListProps {
  relationships: TherapeuticRelationship[]
  assignmentsByClient: Record<string, { active: number; completed: number; total: number }>
  superviseeCount: number
  maxSupervisees: number
  tier: SubscriptionTier
}

export function SuperviseeList({
  relationships,
  assignmentsByClient,
  superviseeCount,
  maxSupervisees,
  tier,
}: SuperviseeListProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdd = maxSupervisees === Infinity || superviseeCount < maxSupervisees
  const atLimit = !canAdd

  // Tier gating: supervision requires Practice (standard) or above
  const tierBlocked = maxSupervisees === 0

  const handleLabelChange = (value: string) => {
    setNewLabel(value)
    setError(null)
    if (value.trim()) {
      const validation = validateSuperviseeLabel(value)
      if (!validation.valid) {
        setError(validation.error!)
      }
    }
  }

  const handleAdd = async () => {
    if (!newLabel.trim()) return

    const validation = validateSuperviseeLabel(newLabel)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setLoading(true)
    setError(null)

    const result = await createSupervisee(newLabel)

    if (result.error) {
      setError(result.error)
    } else {
      setNewLabel('')
      setShowAdd(false)
    }
    setLoading(false)
  }

  const handleEnd = async (id: string) => {
    if (!confirm('End supervision with this supervisee? They can be reactivated later.')) return
    await endSupervision(id)
  }

  const handleReactivate = async (id: string) => {
    await reactivateSupervisee(id)
  }

  const activeSupervisees = relationships.filter((r) => r.status === 'active')
  const endedSupervisees = relationships.filter((r) => r.status === 'discharged')

  // Tier-gated state: show upgrade prompt
  if (tierBlocked) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
        <svg className="mx-auto h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
        <h3 className="mt-3 text-sm font-medium text-primary-800">Supervision Portal</h3>
        <p className="mt-1 text-sm text-primary-500">
          Manage your supervisees and assign structured supervision preparation worksheets.
          Available on the Practice plan and above.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-block rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
        >
          Upgrade to access
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Usage indicator */}
      {maxSupervisees !== Infinity && (
        <div className="rounded-2xl border border-brand/20 bg-brand-light p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
                <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">
                  {superviseeCount} of {maxSupervisees} supervisees
                </p>
                <p className="text-xs text-primary-500">{tier === 'standard' ? 'Practice' : 'Specialist'} plan</p>
              </div>
            </div>
            {atLimit && (
              <Link
                href="/pricing"
                className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Add supervisee */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary-900">
          Active supervisees ({activeSupervisees.length})
        </h2>
        {!showAdd && (
          <button
            onClick={() => {
              if (atLimit) {
                setError(`Your plan is limited to ${maxSupervisees} supervisees. Upgrade to add more.`)
                return
              }
              setShowAdd(true)
            }}
            className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300 transition-colors"
          >
            + Add supervisee
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          {error.includes('Upgrade') && (
            <Link href="/pricing" className="ml-2 font-medium underline underline-offset-2">
              View plans
            </Link>
          )}
        </div>
      )}

      {showAdd && (
        <div className="rounded-2xl border border-primary-200 bg-surface p-4 shadow-sm">
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Supervisee name
          </label>
          <p className="text-xs text-primary-400 mb-3">
            Enter your supervisee&apos;s name or an identifying label.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. Dr Sarah Chen, Trainee A"
              maxLength={50}
              className="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newLabel.trim()}
              className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewLabel(''); setError(null) }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active supervisees list */}
      {activeSupervisees.length === 0 && !showAdd ? (
        <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
          <svg className="mx-auto h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-primary-800">No supervisees yet</h3>
          <p className="mt-1 text-sm text-primary-500">
            Add a supervisee to start assigning supervision preparation worksheets.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300"
          >
            Add your first supervisee
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeSupervisees.map((r) => {
            const stats = assignmentsByClient[r.id] || { active: 0, completed: 0, total: 0 }
            return (
              <Link
                key={r.id}
                href={`/supervision/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm hover:border-brand/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                    {r.client_label.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-primary-800">{r.client_label}</p>
                    <p className="text-xs text-primary-400">
                      Since {new Date(r.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {stats.active > 0 && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark">
                      {stats.active} active
                    </span>
                  )}
                  {stats.completed > 0 && (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {stats.completed} completed
                    </span>
                  )}
                  <svg className="h-4 w-4 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Ended supervision */}
      {endedSupervisees.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-400">
            Ended supervision ({endedSupervisees.length})
          </h2>
          <div className="space-y-2">
            {endedSupervisees.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-primary-100 bg-primary-50/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-400">
                    {r.client_label.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-primary-500">{r.client_label}</p>
                    <p className="text-xs text-primary-400">
                      Ended {r.ended_at ? new Date(r.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/supervision/${r.id}`}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-surface transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleReactivate(r.id) }}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-surface transition-colors"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
