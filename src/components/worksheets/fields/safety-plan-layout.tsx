'use client'

import type { WorksheetSection, WorksheetField } from '@/types/worksheet'

interface Props {
  sections: WorksheetSection[]
  renderField: (field: WorksheetField) => React.ReactNode
}

export function SafetyPlanLayout({ sections, renderField }: Props) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const stepNumber = section.step
        const sectionLabel = section.label || section.title
        const isRedStep = section.highlight === 'red'

        return (
          <div key={section.id} className="flex gap-4">
            {/* Step number circle */}
            {stepNumber != null && (
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                  isRedStep ? 'bg-red-600' : 'bg-primary-800'
                }`}
              >
                {stepNumber}
              </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-2">
              {sectionLabel && (
                <h3
                  className={`text-sm font-semibold ${
                    isRedStep ? 'text-red-700' : 'text-primary-900'
                  }`}
                >
                  {sectionLabel}
                </h3>
              )}
              {section.hint && (
                <p className="text-xs italic text-primary-400">
                  {section.hint}
                </p>
              )}
              {section.description && (
                <p className="text-xs italic text-primary-400">
                  {section.description}
                </p>
              )}
              <div className="space-y-3">
                {section.fields.map(renderField)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Read-only version for reviewing submitted safety plans */
export function SafetyPlanReadOnly({
  sections,
  renderReadOnlyField,
}: {
  sections: WorksheetSection[]
  renderReadOnlyField: (field: WorksheetField) => React.ReactNode
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const stepNumber = section.step
        const sectionLabel = section.label || section.title
        const isRedStep = section.highlight === 'red'

        return (
          <div key={section.id} className="flex gap-4">
            {stepNumber != null && (
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                  isRedStep ? 'bg-red-600' : 'bg-primary-800'
                }`}
              >
                {stepNumber}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1.5">
              {sectionLabel && (
                <h3
                  className={`text-sm font-semibold ${
                    isRedStep ? 'text-red-700' : 'text-primary-900'
                  }`}
                >
                  {sectionLabel}
                </h3>
              )}
              {section.hint && (
                <p className="text-xs italic text-primary-400">
                  {section.hint}
                </p>
              )}
              <div className="space-y-2">
                {section.fields.map(renderReadOnlyField)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
