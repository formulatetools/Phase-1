'use client'

import { useState, useCallback } from 'react'
import type { WorksheetSchema, WorksheetField } from '@/types/worksheet'
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
  onValuesChange?: (values: Record<string, FieldValue>) => void
}

export function WorksheetRenderer({
  schema,
  readOnly = false,
  onValuesChange,
}: WorksheetRendererProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const initial: Record<string, FieldValue> = {}
    for (const section of schema.sections) {
      for (const field of section.fields) {
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

  const renderField = (field: WorksheetField) => {
    if (readOnly) {
      return (
        <div key={field.id} className="text-sm text-primary-600">
          <span className="font-medium text-primary-700">{field.label}:</span>{' '}
          {JSON.stringify(values[field.id])}
        </div>
      )
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
