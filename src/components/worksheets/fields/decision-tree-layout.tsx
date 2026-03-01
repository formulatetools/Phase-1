'use client'

import type { WorksheetSection, WorksheetField } from '@/types/worksheet'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

interface Props {
  /** The sections of the decision tree worksheet */
  sections: WorksheetSection[]
  /** Current form values */
  values: Record<string, FieldValue>
  /** Standard field renderer from parent */
  renderField: (field: WorksheetField) => React.ReactNode
  /** Update a value */
  updateValue: (fieldId: string, value: FieldValue) => void
}

export function DecisionTreeLayout({
  sections,
  values,
  renderField,
  updateValue,
}: Props) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        // Regular section — render normally
        if (section.type !== 'branch') {
          return (
            <div key={section.id} className="space-y-3">
              {section.title && (
                <h3 className="text-sm font-semibold text-primary-900">
                  {section.title}
                </h3>
              )}
              <div className="space-y-3">
                {section.fields.map(renderField)}
              </div>
            </div>
          )
        }

        // Branch section — decision node
        const branchValue = values[section.id] as string | undefined
        const branches = section.branches
        if (!branches) return null

        return (
          <div key={section.id} className="space-y-4">
            {/* Question node */}
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
              <p className="text-sm font-semibold text-primary-800">
                {section.question}
              </p>
            </div>

            {/* Branch buttons */}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => updateValue(section.id, 'yes')}
                className={`rounded-lg border-2 px-5 py-2 text-sm font-semibold transition-colors ${
                  branchValue === 'yes'
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-400'
                    : 'border-primary-200 text-primary-500 hover:border-green-300 hover:text-green-600'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => updateValue(section.id, 'no')}
                className={`rounded-lg border-2 px-5 py-2 text-sm font-semibold transition-colors ${
                  branchValue === 'no'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-400'
                    : 'border-primary-200 text-primary-500 hover:border-red-300 hover:text-red-600'
                }`}
              >
                No
              </button>
            </div>

            {/* Selected branch content */}
            {branchValue === 'yes' && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {branches.yes.label}
                </p>
                {branches.yes.fields?.map((f) => {
                  const fieldDef: WorksheetField = {
                    id: f.id,
                    type: f.type as 'text' | 'textarea',
                    label: f.label,
                    placeholder: f.placeholder,
                  }
                  return renderField(fieldDef)
                })}
                <div className="mt-2 rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-sm text-green-800 dark:text-green-200">
                  {branches.yes.outcome}
                </div>
              </div>
            )}

            {branchValue === 'no' && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {branches.no.label}
                </p>
                {branches.no.fields?.map((f) => {
                  const fieldDef: WorksheetField = {
                    id: f.id,
                    type: f.type as 'text' | 'textarea',
                    label: f.label,
                    placeholder: f.placeholder,
                  }
                  return renderField(fieldDef)
                })}
                <div className="mt-2 rounded-lg bg-red-100 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-200">
                  {branches.no.outcome}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Read-only version */
export function DecisionTreeReadOnly({
  sections,
  values,
  renderReadOnlyField,
}: {
  sections: WorksheetSection[]
  values: Record<string, FieldValue>
  renderReadOnlyField: (field: WorksheetField) => React.ReactNode
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        if (section.type !== 'branch') {
          return (
            <div key={section.id} className="space-y-2">
              {section.title && (
                <h3 className="text-sm font-semibold text-primary-900">
                  {section.title}
                </h3>
              )}
              <div className="space-y-2">
                {section.fields.map(renderReadOnlyField)}
              </div>
            </div>
          )
        }

        const branchValue = values[section.id] as string | undefined
        const branches = section.branches
        if (!branches || !branchValue) return null

        const selectedBranch = branchValue === 'yes' ? branches.yes : branches.no
        const isYes = branchValue === 'yes'

        return (
          <div key={section.id} className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
              <p className="text-sm font-medium text-primary-700">
                {section.question}
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  isYes ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                {isYes ? 'Yes' : 'No'} \u2014 {selectedBranch.label}
              </p>
            </div>

            {selectedBranch.fields?.map((f) => {
              const fieldDef: WorksheetField = {
                id: f.id,
                type: f.type as 'text' | 'textarea',
                label: f.label,
                placeholder: f.placeholder,
              }
              return renderReadOnlyField(fieldDef)
            })}

            <div
              className={`rounded-lg p-3 text-sm ${
                isYes
                  ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800'
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'
              }`}
            >
              {selectedBranch.outcome}
            </div>
          </div>
        )
      })}
    </div>
  )
}
