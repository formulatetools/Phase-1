'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TherapeuticRelationship, SubscriptionTier } from '@/types/database'
import { createClient_action, dischargeClient, reactivateClient } from '@/app/(dashboard)/clients/actions'
import { validateClientLabel } from '@/lib/validation/client-label'

interface ClientListProps {
  relationships: TherapeuticRelationship[]
  assignmentsByClient: Record<string, { active: number; completed: number; total: number }>
  clientCount: number
  activeAssignmentCount: number
  maxClients: number
  maxActiveAssignments: number
  tier: SubscriptionTier
}

export function ClientList({
  relationships,
  assignmentsByClient,
  clientCount,
  maxClients,
  tier,
}: ClientListProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [piiWarning, setPiiWarning] = useState<string | null>(null)

  const canAddClient = maxClients === Infinity || clientCount < maxClients
  const atLimit = !canAddClient

  const handleLabelChange = (value: string) => {
    setNewLabel(value)
    setError(null)
    if (value.trim()) {
      const validation = validateClientLabel(value)
      if (!validation.valid) {
        setError(validation.error!)
        setPiiWarning(null)
      } else {
        setPiiWarning(validation.warning || null)
      }
    } else {
      setPiiWarning(null)
    }
  }

  const handleAdd = async () => {
    if (!newLabel.trim()) return

    // Final PII check before submitting
    const validation = validateClientLabel(newLabel)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setLoading(true)
    setError(null)

    const result = await createClient_action(newLabel)

    if (result.error) {
      setError(result.error)
    } else {
      setNewLabel('')
      setShowAdd(false)
      setPiiWarning(null)
    }
    setLoading(false)
  }

  const handleDischarge = async (id: string) => {
    if (!confirm('Discharge this client? They will be moved to the discharged list.')) return
    await dischargeClient(id)
  }

  const handleReactivate = async (id: string) => {
    await reactivateClient(id)
  }

  const activeClients = relationships.filter((r) => r.status === 'active')
  const dischargedClients = relationships.filter((r) => r.status === 'discharged')

  return (
    <div className="space-y-6">
      {/* Usage indicator for free tier */}
      {tier === 'free' && (
        <div className="rounded-2xl border border-brand/20 bg-brand-light p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
                <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">
                  {clientCount} of {maxClients} clients used
                </p>
                <p className="text-xs text-primary-500">Free plan</p>
              </div>
            </div>
            {atLimit && (
              <Link
                href="/pricing"
                className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Add client */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary-900">
          Active clients ({activeClients.length})
        </h2>
        {!showAdd && (
          <button
            onClick={() => {
              if (atLimit) {
                setError(`Free plan is limited to ${maxClients} clients. Upgrade to add more.`)
                return
              }
              setShowAdd(true)
            }}
            className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 transition-colors"
          >
            + Add client
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
        <div className="rounded-2xl border border-primary-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Client label
          </label>
          <p className="text-xs text-primary-400 mb-3">
            Use initials or a pseudonym — no personally identifiable information.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. AB, Client-7, Blue"
              maxLength={50}
              className="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newLabel.trim()}
              className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewLabel(''); setError(null); setPiiWarning(null) }}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {piiWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {piiWarning}
            </div>
          )}
        </div>
      )}

      {/* Active clients list */}
      {activeClients.length === 0 && !showAdd ? (
        <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
          <svg className="mx-auto h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-primary-800">No clients yet</h3>
          <p className="mt-1 text-sm text-primary-500">
            Add a client to start assigning homework worksheets.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900"
          >
            Add your first client
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeClients.map((r) => {
            const stats = assignmentsByClient[r.id] || { active: 0, completed: 0, total: 0 }
            return (
              <Link
                key={r.id}
                href={`/clients/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-primary-100 bg-white p-4 shadow-sm hover:border-brand/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
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

      {/* Discharged clients */}
      {dischargedClients.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-400">
            Discharged ({dischargedClients.length})
          </h2>
          <div className="space-y-2">
            {dischargedClients.map((r) => (
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
                      Discharged {r.ended_at ? new Date(r.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/clients/${r.id}`}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-white transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleReactivate(r.id) }}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-white transition-colors"
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
