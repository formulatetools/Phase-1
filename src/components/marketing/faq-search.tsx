'use client'

import { useState, useMemo } from 'react'
import type { FaqItem, FaqCategory } from '@/lib/faq-data'
import { KeyFaqList, ExtendedFaqSection } from '@/components/marketing/faq-accordion'

interface FaqSearchProps {
  keyFaq: FaqItem[]
  extendedFaq: FaqCategory[]
}

export function FaqSearch({ keyFaq, extendedFaq }: FaqSearchProps) {
  const [query, setQuery] = useState('')

  const allItems = useMemo(() => {
    const extended = extendedFaq.flatMap((cat) => cat.questions)
    return [...keyFaq, ...extended]
  }, [keyFaq, extendedFaq])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return null // null = show default layout
    const q = query.toLowerCase()
    return allItems.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    )
  }, [query, allItems])

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-xl border border-primary-200 bg-surface py-3 pl-10 pr-4 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>

      {/* Results */}
      {filteredItems !== null ? (
        <div className="mt-8">
          {filteredItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-primary-400">
              No questions match your search
            </p>
          ) : (
            <div>
              <p className="mb-4 text-sm text-primary-400">
                {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
              </p>
              <KeyFaqList items={filteredItems} />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Default layout — Key FAQ */}
          <section className="mt-12">
            <KeyFaqList items={keyFaq} />
          </section>

          {/* Divider */}
          <div className="mt-16 border-t border-primary-200 pt-12">
            <h2 className="text-center text-lg font-semibold text-primary-700">
              More Questions
            </h2>
            <p className="mt-1 text-center text-sm text-primary-400">
              Tap a category to expand
            </p>
          </div>

          {/* Extended FAQ */}
          <section className="mt-8">
            <ExtendedFaqSection categories={extendedFaq} />
          </section>
        </>
      )}
    </div>
  )
}
