'use client'

import { useState, useCallback } from 'react'
import type { WorksheetSection, WorksheetField, DomainType } from '@/types/worksheet'
import { getDomainColor } from '@/lib/domain-colors'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

interface Props {
  layout: 'formulation_cross_sectional' | 'formulation_vicious_flower' | 'formulation_longitudinal'
  sections: WorksheetSection[]
  values: Record<string, FieldValue>
  renderField: (field: WorksheetField) => React.ReactNode
  updateValue: (fieldId: string, value: FieldValue) => void
}

// ──────────────────────────────────────────────────────────
// Cross-Sectional (Hot Cross Bun / 5 Areas)
// ──────────────────────────────────────────────────────────

function CrossSectionalLayout({
  sections,
  renderField,
}: Pick<Props, 'sections' | 'renderField'>) {
  // Expected order: situation (top), thoughts/emotions/physical (middle), behaviour (bottom)
  const situation = sections.find((s) => s.domain === 'situation')
  const thoughts = sections.find((s) => s.domain === 'thoughts')
  const emotions = sections.find((s) => s.domain === 'emotions')
  const physical = sections.find((s) => s.domain === 'physical')
  const behaviour = sections.find((s) => s.domain === 'behaviour')

  const renderDomainSection = (
    section: WorksheetSection | undefined,
    domain: DomainType
  ) => {
    if (!section) return null
    const colors = getDomainColor(domain)

    return (
      <div
        className="rounded-xl border-2 p-4"
        style={{ borderColor: colors.border, backgroundColor: colors.bg }}
      >
        <p
          className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider"
          style={{ color: colors.text }}
        >
          {colors.label}
        </p>
        <div className="space-y-2">
          {section.fields.map(renderField)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Situation — full width */}
      {renderDomainSection(situation, 'situation')}

      {/* Down arrow */}
      <div className="flex justify-center">
        <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </div>

      {/* Middle row — stacked on mobile, 3 columns on sm+ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {renderDomainSection(thoughts, 'thoughts')}
        {renderDomainSection(emotions, 'emotions')}
        {renderDomainSection(physical, 'physical')}
      </div>

      {/* Connecting arrows between middle sections (hidden on mobile where they stack) */}
      <div className="hidden justify-center gap-16 sm:flex">
        <svg className="h-4 w-16 text-primary-200" viewBox="0 0 64 16">
          <line x1="0" y1="8" x2="64" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="6,4 0,8 6,12" fill="currentColor" />
          <polygon points="58,4 64,8 58,12" fill="currentColor" />
        </svg>
        <svg className="h-4 w-16 text-primary-200" viewBox="0 0 64 16">
          <line x1="0" y1="8" x2="64" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="6,4 0,8 6,12" fill="currentColor" />
          <polygon points="58,4 64,8 58,12" fill="currentColor" />
        </svg>
      </div>

      {/* Down arrow */}
      <div className="flex justify-center">
        <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </div>

      {/* Behaviour — full width */}
      {renderDomainSection(behaviour, 'behaviour')}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Vicious Flower (Central problem + radial petals)
// ──────────────────────────────────────────────────────────

interface PetalData {
  petal_label: string
  petal_content: string
  domain: DomainType
}

function ViciousFlowerLayout({
  sections,
  values,
  updateValue,
}: Pick<Props, 'sections' | 'values' | 'updateValue'>) {
  const centreSection = sections.find((s) => s.id === 'centre')
  const petalsSection = sections.find((s) => s.id === 'petals' || s.dynamic)

  // Initialize petals from default_items or existing values
  const [petals, setPetals] = useState<PetalData[]>(() => {
    const existing = values['petals'] as unknown as PetalData[] | undefined
    if (existing && Array.isArray(existing) && existing.length > 0) return existing

    if (petalsSection?.default_items) {
      return petalsSection.default_items.map((item) => ({
        petal_label: item.petal_label,
        petal_content: '',
        domain: item.domain,
      }))
    }
    return [
      { petal_label: 'Thoughts', petal_content: '', domain: 'thoughts' as DomainType },
      { petal_label: 'Emotions', petal_content: '', domain: 'emotions' as DomainType },
      { petal_label: 'Behaviour', petal_content: '', domain: 'behaviour' as DomainType },
    ]
  })

  const minItems = petalsSection?.min_items ?? 3
  const maxItems = petalsSection?.max_items ?? 8

  const updatePetal = useCallback(
    (index: number, field: keyof PetalData, val: string) => {
      const updated = petals.map((p, i) =>
        i === index ? { ...p, [field]: val } : p
      )
      setPetals(updated)
      updateValue('petals', updated as unknown as FieldValue)
    },
    [petals, updateValue]
  )

  const addPetal = () => {
    if (petals.length < maxItems) {
      const updated = [
        ...petals,
        { petal_label: '', petal_content: '', domain: 'behaviour' as DomainType },
      ]
      setPetals(updated)
      updateValue('petals', updated as unknown as FieldValue)
    }
  }

  const removePetal = (index: number) => {
    if (petals.length > minItems) {
      const updated = petals.filter((_, i) => i !== index)
      setPetals(updated)
      updateValue('petals', updated as unknown as FieldValue)
    }
  }

  return (
    <div className="space-y-6">
      {/* Centre — Presenting Problem */}
      {centreSection && (
        <div className="mx-auto max-w-md rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
          <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">
            Presenting Problem
          </p>
          <textarea
            value={(values[centreSection.fields[0]?.id] as string) || ''}
            onChange={(e) =>
              updateValue(centreSection.fields[0]?.id, e.target.value)
            }
            placeholder={centreSection.fields[0]?.placeholder || 'Central problem'}
            rows={3}
            className="w-full resize-none rounded-lg border border-amber-200 bg-surface px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          />
        </div>
      )}

      {/* Radial connector lines (simplified as grid for web) */}
      <div className="flex justify-center">
        <svg className="h-8 w-8 text-primary-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* Petals — displayed as a responsive grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {petals.map((petal, index) => {
          const colors = getDomainColor(petal.domain)

          return (
            <div
              key={index}
              className="group relative rounded-xl border-2 p-4"
              style={{ borderColor: colors.border, backgroundColor: colors.bg }}
            >
              {/* Remove button */}
              {petals.length > minItems && (
                <button
                  type="button"
                  onClick={() => removePetal(index)}
                  className="absolute right-2 top-2 text-primary-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="Remove petal"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Petal label */}
              <input
                type="text"
                value={petal.petal_label}
                onChange={(e) => updatePetal(index, 'petal_label', e.target.value)}
                placeholder="Factor label"
                className="mb-2 w-full border-0 bg-transparent p-0 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-0"
                style={{ color: colors.text }}
              />

              {/* Petal content */}
              <textarea
                value={petal.petal_content}
                onChange={(e) =>
                  updatePetal(index, 'petal_content', e.target.value)
                }
                placeholder="How does this maintain the problem?"
                rows={3}
                className="w-full resize-none rounded border border-primary-200/50 bg-surface/80 px-2 py-1.5 text-sm text-primary-800 placeholder-primary-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          )
        })}
      </div>

      {/* Add petal button */}
      {petals.length < maxItems && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addPetal}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary-300 px-4 py-2 text-sm font-medium text-primary-500 hover:border-primary-400 hover:text-primary-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add petal
          </button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Longitudinal (Beckian developmental flow)
// ──────────────────────────────────────────────────────────

function LongitudinalLayout({
  sections,
  renderField,
}: Pick<Props, 'sections' | 'renderField'>) {
  return (
    <div className="space-y-1">
      {sections.map((section, index) => {
        const isAmber = section.highlight === 'amber'
        const isRedDashed = section.highlight === 'red_dashed'
        const isFourQuadrant = section.layout === 'four_quadrant'
        const sectionLabel = section.title || section.label

        let borderClass = 'border-primary-200'
        let bgClass = 'bg-surface'

        if (isAmber) {
          borderClass = 'border-amber-300'
          bgClass = 'bg-amber-50/50'
        } else if (isRedDashed) {
          borderClass = 'border-red-300 border-dashed'
          bgClass = 'bg-red-50/30'
        }

        return (
          <div key={section.id}>
            {/* Down arrow between sections */}
            {index > 0 && (
              <div className="flex justify-center py-2">
                <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>
            )}

            {/* Section box */}
            <div
              className={`rounded-xl border-2 p-4 ${borderClass} ${bgClass}`}
            >
              {sectionLabel && (
                <h3
                  className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                    isAmber
                      ? 'text-amber-700'
                      : isRedDashed
                      ? 'text-red-600'
                      : 'text-primary-500'
                  }`}
                >
                  {sectionLabel}
                </h3>
              )}

              {/* Four quadrant layout for maintenance cycle */}
              {isFourQuadrant ? (
                <div className="grid grid-cols-2 gap-3">
                  {section.fields.map((field) => {
                    const domain = (field as { domain?: DomainType }).domain
                    const colors = getDomainColor(domain)

                    return (
                      <div key={field.id} className="space-y-1">
                        <p
                          className="text-[0.6rem] font-semibold uppercase tracking-wider"
                          style={{ color: colors.text }}
                        >
                          {field.label}
                        </p>
                        {renderField({
                          ...field,
                          label: '', // Hide duplicate label
                        })}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {section.fields.map(renderField)}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Main dispatcher
// ──────────────────────────────────────────────────────────

export function FormulationLayout(props: Props) {
  switch (props.layout) {
    case 'formulation_cross_sectional':
      return (
        <CrossSectionalLayout
          sections={props.sections}
          renderField={props.renderField}
        />
      )
    case 'formulation_vicious_flower':
      return (
        <ViciousFlowerLayout
          sections={props.sections}
          values={props.values}
          updateValue={props.updateValue}
        />
      )
    case 'formulation_longitudinal':
      return (
        <LongitudinalLayout
          sections={props.sections}
          renderField={props.renderField}
        />
      )
    default:
      return null
  }
}

// ──────────────────────────────────────────────────────────
// Read-only versions
// ──────────────────────────────────────────────────────────

interface ReadOnlyProps {
  layout: 'formulation_cross_sectional' | 'formulation_vicious_flower' | 'formulation_longitudinal'
  sections: WorksheetSection[]
  values: Record<string, FieldValue>
  renderReadOnlyField: (field: WorksheetField) => React.ReactNode
}

function CrossSectionalReadOnly({
  sections,
  renderReadOnlyField,
}: Pick<ReadOnlyProps, 'sections' | 'renderReadOnlyField'>) {
  const situation = sections.find((s) => s.domain === 'situation')
  const thoughts = sections.find((s) => s.domain === 'thoughts')
  const emotions = sections.find((s) => s.domain === 'emotions')
  const physical = sections.find((s) => s.domain === 'physical')
  const behaviour = sections.find((s) => s.domain === 'behaviour')

  const renderDomainSection = (section: WorksheetSection | undefined, domain: DomainType) => {
    if (!section) return null
    const colors = getDomainColor(domain)
    return (
      <div className="rounded-xl border-2 p-3" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
        <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
          {colors.label}
        </p>
        <div className="space-y-1">{section.fields.map(renderReadOnlyField)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {renderDomainSection(situation, 'situation')}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {renderDomainSection(thoughts, 'thoughts')}
        {renderDomainSection(emotions, 'emotions')}
        {renderDomainSection(physical, 'physical')}
      </div>
      {renderDomainSection(behaviour, 'behaviour')}
    </div>
  )
}

function ViciousFlowerReadOnly({
  sections,
  values,
  renderReadOnlyField,
}: Pick<ReadOnlyProps, 'sections' | 'values' | 'renderReadOnlyField'>) {
  const centreSection = sections.find((s) => s.id === 'centre')
  const petals = (values['petals'] as unknown as PetalData[]) || []

  return (
    <div className="space-y-4">
      {centreSection && (
        <div className="mx-auto max-w-md rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
          <p className="mb-1 text-center text-[0.6rem] font-semibold uppercase tracking-wider text-amber-700">
            Presenting Problem
          </p>
          <div className="space-y-1">{centreSection.fields.map(renderReadOnlyField)}</div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {petals.map((petal, i) => {
          const colors = getDomainColor(petal.domain)
          return (
            <div key={i} className="rounded-xl border-2 p-3" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
              <p className="mb-1 text-xs font-semibold uppercase" style={{ color: colors.text }}>
                {petal.petal_label}
              </p>
              {petal.petal_content ? (
                <p className="text-sm text-primary-700">{petal.petal_content}</p>
              ) : (
                <p className="text-sm italic text-primary-400">Not answered</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LongitudinalReadOnly({
  sections,
  renderReadOnlyField,
}: Pick<ReadOnlyProps, 'sections' | 'renderReadOnlyField'>) {
  return (
    <div className="space-y-1">
      {sections.map((section, index) => {
        const isAmber = section.highlight === 'amber'
        const isRedDashed = section.highlight === 'red_dashed'
        const isFourQuadrant = section.layout === 'four_quadrant'
        const sectionLabel = section.title || section.label
        let borderClass = 'border-primary-200'
        let bgClass = 'bg-surface'
        if (isAmber) { borderClass = 'border-amber-300'; bgClass = 'bg-amber-50/50' }
        else if (isRedDashed) { borderClass = 'border-red-300 border-dashed'; bgClass = 'bg-red-50/30' }

        return (
          <div key={section.id}>
            {index > 0 && (
              <div className="flex justify-center py-1.5">
                <svg className="h-5 w-5 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>
            )}
            <div className={`rounded-xl border-2 p-3 ${borderClass} ${bgClass}`}>
              {sectionLabel && (
                <h3 className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${
                  isAmber ? 'text-amber-700' : isRedDashed ? 'text-red-600' : 'text-primary-500'
                }`}>
                  {sectionLabel}
                </h3>
              )}
              {isFourQuadrant ? (
                <div className="grid grid-cols-2 gap-2">
                  {section.fields.map((field) => {
                    const domain = (field as { domain?: DomainType }).domain
                    const colors = getDomainColor(domain)
                    return (
                      <div key={field.id} className="space-y-0.5">
                        <p className="text-[0.6rem] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
                          {field.label}
                        </p>
                        {renderReadOnlyField({ ...field, label: '' })}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-1">{section.fields.map(renderReadOnlyField)}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FormulationReadOnly(props: ReadOnlyProps) {
  switch (props.layout) {
    case 'formulation_cross_sectional':
      return <CrossSectionalReadOnly sections={props.sections} renderReadOnlyField={props.renderReadOnlyField} />
    case 'formulation_vicious_flower':
      return <ViciousFlowerReadOnly sections={props.sections} values={props.values} renderReadOnlyField={props.renderReadOnlyField} />
    case 'formulation_longitudinal':
      return <LongitudinalReadOnly sections={props.sections} renderReadOnlyField={props.renderReadOnlyField} />
    default:
      return null
  }
}
