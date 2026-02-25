'use client'

import { useEffect, useState } from 'react'

interface PickedWorksheet {
  id: string
  title: string
  slug: string
  description: string
  category: string
}

interface WorksheetPickerModalProps {
  onSelect: (ws: PickedWorksheet) => void
  onClose: () => void
}

export function WorksheetPickerModal({ onSelect, onClose }: WorksheetPickerModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickedWorksheet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch published worksheets for selection
    const fetchWorksheets = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/blog/worksheets-for-embed')
        if (res.ok) {
          const data = await res.json()
          setResults(data.worksheets || [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchWorksheets()
  }, [])

  const filtered = query.trim()
    ? results.filter(
        (w) =>
          w.title.toLowerCase().includes(query.toLowerCase()) ||
          w.description.toLowerCase().includes(query.toLowerCase())
      )
    : results

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border border-primary-100 bg-surface shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-primary-900">Embed a Worksheet</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-primary-400 hover:text-primary-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <input
            type="text"
            placeholder="Search worksheets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-400"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-5 py-3 space-y-1">
          {loading ? (
            <p className="text-xs text-primary-400 py-4 text-center">Loading worksheets…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-primary-400 py-4 text-center">No worksheets found</p>
          ) : (
            filtered.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => onSelect(ws)}
                className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-primary-50 transition-colors group"
              >
                <p className="text-sm font-medium text-primary-800 group-hover:text-primary-900">
                  {ws.title}
                </p>
                <p className="text-xs text-primary-400 line-clamp-1">{ws.description}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
