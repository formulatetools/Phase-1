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
  const [filtersOpen, setFiltersOpen] = useState(!!initialTag)
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
            data-search-input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search worksheets by title, description, or keyword..."
            className="w-full rounded-xl border border-primary-200 bg-surface py-2.5 pl-10 pr-10 text-sm text-primary-900 placeholder-primary-400 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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

      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary-500 sm:hidden"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
        </svg>
        {filtersOpen ? 'Hide filters' : 'Filters'}
        {activeTag && <span className="rounded-full bg-primary-800 px-1.5 py-0.5 text-[10px] text-white">1</span>}
      </button>

      {/* Tag filter chips — always visible on sm+, collapsible on mobile */}
      <div className={`flex-wrap items-center gap-1.5 ${filtersOpen ? 'flex' : 'hidden sm:flex'}`}>
        <span className="mr-1 text-xs font-medium text-primary-400">Filter:</span>
        {displayTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              activeTag === tag
                ? 'bg-primary-800 text-white shadow-sm'
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
