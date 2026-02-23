'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  initialQuery?: string
  initialTag?: string
  allTags?: string[]
}

// Most useful clinical tags for quick filtering (curated subset)
const FEATURED_TAGS = [
  'CBT',
  'formulation',
  'depression',
  'anxiety',
  'OCD',
  'PTSD',
  'exposure',
  'behavioural activation',
  'cognitive restructuring',
  'self-esteem',
  'safety plan',
]

export function WorksheetSearch({ initialQuery, initialTag, allTags = [] }: Props) {
  const [query, setQuery] = useState(initialQuery || '')
  const [activeTag, setActiveTag] = useState(initialTag || '')
  const [showAllTags, setShowAllTags] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // Debounced search — triggers after 300ms of no typing
  const pushSearch = useCallback(
    (q: string, tag: string) => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (tag) params.set('tag', tag)
      const qs = params.toString()
      router.push(qs ? `/worksheets?${qs}` : '/worksheets')
    },
    [router]
  )

  useEffect(() => {
    // Skip the initial render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushSearch(query, activeTag)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, activeTag, pushSearch])

  const handleTagClick = (tag: string) => {
    const newTag = activeTag === tag ? '' : tag
    setActiveTag(newTag)
  }

  const clearAll = () => {
    setQuery('')
    setActiveTag('')
    router.push('/worksheets')
  }

  const hasFilters = query.trim() || activeTag

  // Build the tag list to show
  const displayTags = showAllTags
    ? [...new Set([...FEATURED_TAGS, ...allTags])].sort()
    : FEATURED_TAGS

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
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
            placeholder="Search worksheets by title, description, or keyword..."
            className="w-full rounded-xl border border-primary-200 bg-white py-2.5 pl-10 pr-10 text-sm text-primary-900 placeholder-primary-400 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-primary-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tag filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-primary-400">Filter:</span>
        {displayTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              activeTag === tag
                ? 'bg-brand text-white shadow-sm'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
          >
            {tag}
          </button>
        ))}
        {allTags.length > FEATURED_TAGS.length && (
          <button
            onClick={() => setShowAllTags(!showAllTags)}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/5 transition-colors"
          >
            {showAllTags ? 'Show less' : `+${allTags.length - FEATURED_TAGS.length} more`}
          </button>
        )}
      </div>
    </div>
  )
}
