'use client'

import { useState, useCallback } from 'react'
import type {
  WorksheetSchema,
  WorksheetField,
  TableField as TableFieldSchema,
  ChecklistField as ChecklistFieldSchema,
  LikertField as LikertFieldSchema,
  SelectField as SelectFieldSchema,
} from '@/types/worksheet'
import {
  TextField,
  TextareaField,
  NumberField,
  LikertField,
  ChecklistField,
  DateField,
  TimeField,
  SelectField,
  TableField,
} from './fields'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

interface WorksheetRendererProps {
  schema: WorksheetSchema
  readOnly?: boolean
  initialValues?: Record<string, unknown>
  onValuesChange?: (values: Record<string, FieldValue>) => void
}

export function WorksheetRenderer({
  schema,
  readOnly = false,
  initialValues,
  onValuesChange,
}: WorksheetRendererProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const initial: Record<string, FieldValue> = {}
    for (const section of schema.sections) {
      for (const field of section.fields) {
        // Use provided initial value if available
        if (initialValues && field.id in initialValues) {
          initial[field.id] = initialValues[field.id] as FieldValue
          continue
        }
        switch (field.type) {
          case 'likert':
            initial[field.id] = field.min
            break
          case 'checklist':
            initial[field.id] = []
            break
          case 'table':
            initial[field.id] = Array.from(
              { length: field.min_rows ?? 1 },
              () => {
                const row: Record<string, string | number | ''> = {}
                for (const col of field.columns) {
                  row[col.id] = ''
                }
                return row
              }
            )
            break
          case 'number':
            initial[field.id] = ''
            break
          default:
            initial[field.id] = ''
        }
      }
    }
    return initial
  })

  const updateValue = useCallback(
    (fieldId: string, value: FieldValue) => {
      setValues((prev) => {
        const next = { ...prev, [fieldId]: value }
        onValuesChange?.(next)
        return next
      })
    },
    [onValuesChange]
  )

  const renderReadOnlyField = (field: WorksheetField) => {
    const value = values[field.id]
    const isEmpty = value === '' || value === undefined || value === null ||
      (Array.isArray(value) && value.length === 0)

    switch (field.type) {
      case 'table': {
        const tableField = field as TableFieldSchema
        const rows = (value as Record<string, string | number | ''>[]) || []
        // Filter out completely empty rows
        const filledRows = rows.filter((row) =>
          Object.values(row).some((v) => v !== '' && v !== undefined && v !== null)
        )

        if (filledRows.length === 0) {
          return (
            <div key={field.id} className="space-y-1">
              <p className="text-sm font-medium text-primary-700">{field.label}</p>
              <p className="text-sm italic text-primary-400">No entries</p>
            </div>
          )
        }

        return (
          <div key={field.id} className="space-y-2">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <div className="overflow-x-auto rounded-lg border border-primary-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-200 bg-primary-50">
                    {tableField.columns.map((col) => (
                      <th key={col.id} className="px-3 py-2 text-left font-medium text-primary-600">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {filledRows.map((row, i) => (
                    <tr key={i}>
                      {tableField.columns.map((col) => (
                        <td key={col.id} className="px-3 py-2 text-primary-700">
                          {row[col.id] !== '' && row[col.id] !== undefined
                            ? String(row[col.id])
                            : <span className="text-primary-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      case 'checklist': {
        const checklistField = field as ChecklistFieldSchema
        const selected = (value as string[]) || []
        const optionMap = new Map(checklistField.options.map((o) => [o.id, o.label]))

        if (selected.length === 0) {
          return (
            <div key={field.id} className="space-y-1">
              <p className="text-sm font-medium text-primary-700">{field.label}</p>
              <p className="text-sm italic text-primary-400">None selected</p>
            </div>
          )
        }

        return (
          <div key={field.id} className="space-y-1.5">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark"
                >
                  <svg className="h-3 w-3 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {optionMap.get(id) || id}
                </span>
              ))}
            </div>
          </div>
        )
      }

      case 'likert': {
        const likertField = field as LikertFieldSchema
        const numValue = value as number
        return (
          <div key={field.id} className="space-y-1">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-primary-800">{numValue}</span>
              <span className="text-sm text-primary-400">
                out of {likertField.max}
              </span>
              {likertField.anchors && (
                <span className="text-xs text-primary-400">
                  ({likertField.anchors[String(numValue)] || ''})
                </span>
              )}
            </div>
          </div>
        )
      }

      case 'select': {
        const selectField = field as SelectFieldSchema
        const selectedOption = selectField.options.find((o) => o.id === value)
        return (
          <div key={field.id} className="space-y-1">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <p className="text-sm text-primary-700">
              {selectedOption ? selectedOption.label : (isEmpty ? <span className="italic text-primary-400">Not answered</span> : String(value))}
            </p>
          </div>
        )
      }

      case 'textarea': {
        const textValue = String(value || '')
        return (
          <div key={field.id} className="space-y-1">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            {textValue ? (
              <div className="whitespace-pre-wrap rounded-lg border border-primary-100 bg-primary-50/50 p-3 text-sm text-primary-700">
                {textValue}
              </div>
            ) : (
              <p className="text-sm italic text-primary-400">Not answered</p>
            )}
          </div>
        )
      }

      case 'date': {
        const dateValue = value as string
        return (
          <div key={field.id} className="space-y-1">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <p className="text-sm text-primary-700">
              {dateValue
                ? new Date(dateValue + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : <span className="italic text-primary-400">Not set</span>}
            </p>
          </div>
        )
      }

      case 'time': {
        const timeValue = value as string
        return (
          <div key={field.id} className="space-y-1">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <p className="text-sm text-primary-700">
              {timeValue || <span className="italic text-primary-400">Not set</span>}
            </p>
          </div>
        )
      }

      // text, number, and any other type
      default: {
        return (
          <div key={field.id} className="space-y-1">
            <p className="text-sm font-medium text-primary-700">{field.label}</p>
            <p className="text-sm text-primary-700">
              {isEmpty
                ? <span className="italic text-primary-400">Not answered</span>
                : String(value)}
            </p>
          </div>
        )
      }
    }
  }

  const renderField = (field: WorksheetField) => {
    if (readOnly) {
      return renderReadOnlyField(field)
    }

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={field.id}
            field={field}
            value={values[field.id] as string}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'textarea':
        return (
          <TextareaField
            key={field.id}
            field={field}
            value={values[field.id] as string}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'number':
        return (
          <NumberField
            key={field.id}
            field={field}
            value={values[field.id] as number | ''}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'likert':
        return (
          <LikertField
            key={field.id}
            field={field}
            value={values[field.id] as number}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'checklist':
        return (
          <ChecklistField
            key={field.id}
            field={field}
            value={values[field.id] as string[]}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'date':
        return (
          <DateField
            key={field.id}
            field={field}
            value={values[field.id] as string}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'time':
        return (
          <TimeField
            key={field.id}
            field={field}
            value={values[field.id] as string}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'select':
        return (
          <SelectField
            key={field.id}
            field={field}
            value={values[field.id] as string}
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      case 'table':
        return (
          <TableField
            key={field.id}
            field={field}
            value={values[field.id] as Record<string, string | number | ''>[] }
            onChange={(v) => updateValue(field.id, v)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8 print:space-y-6">
      {schema.sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              {section.title}
            </h3>
            {section.description && (
              <p className="mt-1 text-sm text-primary-500">
                {section.description}
              </p>
            )}
          </div>
          <div className="space-y-4">
            {section.fields.map(renderField)}
          </div>
        </section>
      ))}
    </div>
  )
}
