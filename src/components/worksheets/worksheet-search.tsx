'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Props {
  initialQuery?: string
  initialTag?: string
}

export function WorksheetSearch({ initialQuery, initialTag }: Props) {
  const [query, setQuery] = useState(initialQuery || '')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    const tag = searchParams.get('tag')
    if (tag) params.set('tag', tag)
    router.push(`/worksheets?${params.toString()}`)
  }

  const clearSearch = () => {
    setQuery('')
    router.push('/worksheets')
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search worksheets by title, description, or tags..."
          className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-4 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-900"
      >
        Search
      </button>
      {(initialQuery || initialTag) && (
        <button
          type="button"
          onClick={clearSearch}
          className="rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
        >
          Clear
        </button>
      )}
    </form>
  )
}
