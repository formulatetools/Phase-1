'use client'

import { useState } from 'react'
import type { FaqItem, FaqCategory } from '@/lib/faq-data'

// ─── Chevron icon ────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-primary-400 transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// ─── Key FAQ (all visible, no toggles) ───────────────────────────────────────

export function KeyFaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-primary-100">
      {items.map((item, i) => (
        <div key={i} className="py-6">
          <h3 className="text-base font-semibold text-primary-900">{item.q}</h3>
          <p className="mt-2 text-sm leading-relaxed text-primary-600">{item.a}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Extended FAQ (collapsible category sections) ────────────────────────────

function AccordionItem({ item, isOpen, onToggle }: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-primary-100">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-primary-800">{item.q}</span>
        <Chevron open={isOpen} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-sm leading-relaxed text-primary-500">{item.a}</p>
        </div>
      </div>
    </div>
  )
}

function CategorySection({ category }: { category: FaqCategory }) {
  const [sectionOpen, setSectionOpen] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="rounded-xl border border-primary-100 bg-surface">
      {/* Category header toggle */}
      <button
        type="button"
        onClick={() => {
          setSectionOpen(!sectionOpen)
          if (sectionOpen) setOpenIndex(null)
        }}
        aria-expanded={sectionOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-primary-900">{category.category}</span>
        <Chevron open={sectionOpen} />
      </button>

      {/* Questions within category */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: sectionOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-2">
            {category.questions.map((item, i) => (
              <AccordionItem
                key={i}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ExtendedFaqSection({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => (
        <CategorySection key={i} category={cat} />
      ))}
    </div>
  )
}
