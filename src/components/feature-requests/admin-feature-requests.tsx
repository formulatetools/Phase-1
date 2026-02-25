'use client'

import { useState } from 'react'
import { updateFeatureRequestStatus } from '@/app/(dashboard)/feature-requests/actions'
import type { FeatureRequest, FeatureRequestCategory, FeatureRequestStatus } from '@/types/database'

const CATEGORY_LABELS: Record<FeatureRequestCategory, string> = {
  new_worksheet_or_tool: 'Worksheet / Tool',
  new_psychometric_measure: 'Measure',
  platform_feature: 'Platform',
  integration: 'Integration',
  other: 'Other',
}

const CATEGORY_COLORS: Record<FeatureRequestCategory, string> = {
  new_worksheet_or_tool: 'bg-brand/10 text-brand-dark',
  new_psychometric_measure: 'bg-blue-50 text-blue-700',
  platform_feature: 'bg-purple-50 text-purple-700',
  integration: 'bg-green-50 text-green-700',
  other: 'bg-primary-100 text-primary-600',
}

const STATUS_OPTIONS: { value: FeatureRequestStatus; label: string; color: string }[] = [
  { value: 'submitted', label: 'Submitted', color: 'bg-primary-100 text-primary-600' },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-50 text-amber-700' },
  { value: 'planned', label: 'Planned', color: 'bg-blue-50 text-blue-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-green-50 text-green-700' },
  { value: 'declined', label: 'Declined', color: 'bg-red-50 text-red-700' },
]

interface Props {
  requests: FeatureRequest[]
  voteCounts: Record<string, number>
  userMap: Record<string, { email: string; full_name: string | null }>
}

type SortKey = 'date' | 'upvotes' | 'category' | 'status'

export function AdminFeatureRequests({ requests, voteCounts, userMap }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Sort requests
  const sorted = [...requests].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'date':
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'upvotes':
        cmp = (voteCounts[a.id] || 0) - (voteCounts[b.id] || 0)
        break
      case 'category':
        cmp = a.category.localeCompare(b.category)
        break
      case 'status':
        cmp = a.status.localeCompare(b.status)
        break
    }
    return sortAsc ? cmp : -cmp
  })

  // Filter
  const filtered = filterStatus === 'all'
    ? sorted
    : sorted.filter((r) => r.status === filterStatus)

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc)
    else { setSortBy(key); setSortAsc(false) }
  }

  const handleSelect = (request: FeatureRequest) => {
    if (selectedId === request.id) {
      setSelectedId(null)
    } else {
      setSelectedId(request.id)
      setEditStatus(request.status)
      setEditNotes(request.admin_notes || '')
      setSaveSuccess(false)
    }
  }

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    setSaveSuccess(false)

    const result = await updateFeatureRequestStatus(selectedId, editStatus, editNotes)

    if (result.error) {
      alert(result.error)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
  }

  const selectedRequest = requests.find((r) => r.id === selectedId)
  const statusColor = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-primary-100 text-primary-600'

  const sortIcon = (key: SortKey) => {
    if (sortBy !== key) return null
    return sortAsc ? ' ↑' : ' ↓'
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 p-8 text-center">
        <p className="text-sm text-primary-500">No feature requests yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_OPTIONS.map((s) => {
          const count = requests.filter((r) => r.status === s.value).length
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`rounded-xl border p-3 text-center transition-colors ${
                filterStatus === s.value
                  ? 'border-brand bg-brand/5'
                  : 'border-primary-100 bg-surface hover:bg-primary-50'
              }`}
            >
              <p className="text-lg font-bold text-primary-900">{count}</p>
              <p className="text-xs text-primary-500">{s.label}</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-100 bg-primary-50/50">
              <tr>
                <th
                  className="px-4 py-3 font-medium text-primary-500 cursor-pointer hover:text-primary-700"
                  onClick={() => handleSort('date')}
                >
                  Date{sortIcon('date')}
                </th>
                <th className="px-4 py-3 font-medium text-primary-500">Title</th>
                <th className="px-4 py-3 font-medium text-primary-500">Submitter</th>
                <th
                  className="px-4 py-3 font-medium text-primary-500 cursor-pointer hover:text-primary-700"
                  onClick={() => handleSort('category')}
                >
                  Category{sortIcon('category')}
                </th>
                <th
                  className="px-4 py-3 font-medium text-primary-500 cursor-pointer hover:text-primary-700"
                  onClick={() => handleSort('status')}
                >
                  Status{sortIcon('status')}
                </th>
                <th
                  className="px-4 py-3 font-medium text-primary-500 cursor-pointer hover:text-primary-700 text-right"
                  onClick={() => handleSort('upvotes')}
                >
                  Votes{sortIcon('upvotes')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {filtered.map((request) => {
                const submitter = userMap[request.user_id]
                const isSelected = selectedId === request.id

                return (
                  <tr
                    key={request.id}
                    onClick={() => handleSelect(request)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand/5' : 'hover:bg-primary-50/50'
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-primary-400">
                      {new Date(request.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-800 max-w-xs truncate">
                      {request.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-primary-500 max-w-[150px] truncate">
                      {submitter?.full_name || submitter?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[request.category]}`}>
                        {CATEGORY_LABELS[request.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor(request.status)}`}>
                        {STATUS_OPTIONS.find((s) => s.value === request.status)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary-700">
                      {voteCounts[request.id] || 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / edit panel */}
      {selectedRequest && (
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">{selectedRequest.title}</h3>
              <p className="mt-1 text-sm text-primary-500">
                Submitted by {userMap[selectedRequest.user_id]?.full_name || userMap[selectedRequest.user_id]?.email || 'Unknown'} on{' '}
                {new Date(selectedRequest.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="shrink-0 rounded-lg border border-primary-200 p-1.5 text-primary-400 hover:bg-primary-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedRequest.description && (
            <div>
              <p className="text-xs font-medium text-primary-400 mb-1">Description</p>
              <p className="text-sm text-primary-600">{selectedRequest.description}</p>
            </div>
          )}

          {selectedRequest.current_tool && (
            <div>
              <p className="text-xs font-medium text-primary-400 mb-1">Currently using</p>
              <p className="text-sm text-primary-600">{selectedRequest.current_tool}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-primary-500">
                <span className="font-medium text-primary-700">{voteCounts[selectedRequest.id] || 0}</span> votes
              </div>
            </div>
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Admin Notes <span className="text-primary-400">(internal only)</span>
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this request..."
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none resize-none"
            />
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveSuccess && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
