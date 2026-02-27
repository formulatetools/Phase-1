'use client'

import { useState, useCallback } from 'react'
import type {
  WorksheetSchema,
  WorksheetField,
  WorksheetSection,
  TableField as TableFieldSchema,
  ChecklistField as ChecklistFieldSchema,
  LikertField as LikertFieldSchema,
  SelectField as SelectFieldSchema,
  ComputedField as ComputedFieldSchema,
  HierarchyField as HierarchyFieldSchema,
  FormulationField as FormulationFieldSchema,
  RecordField as RecordFieldSchema,
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
  ComputedField,
  HierarchyField,
  SafetyPlanLayout,
  SafetyPlanReadOnly,
  DecisionTreeLayout,
  DecisionTreeReadOnly,
  FormulationLayout,
  FormulationReadOnly,
  FormulationFieldRenderer,
  RecordFieldRenderer,
} from './fields'
import type { RecordFieldValue } from './fields/record-field'
import { convertLegacyFormulation } from '@/lib/utils/convert-legacy-formulation'

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
      // Initialize branch sections (decision tree)
      if (section.type === 'branch') {
        if (initialValues && section.id in initialValues) {
          initial[section.id] = initialValues[section.id] as FieldValue
        } else {
          initial[section.id] = ''
        }
        // Initialize fields within branches
        if (section.branches) {
          for (const branch of [section.branches.yes, section.branches.no]) {
            if (branch.fields) {
              for (const f of branch.fields) {
                if (initialValues && f.id in initialValues) {
                  initial[f.id] = initialValues[f.id] as FieldValue
                } else {
                  initial[f.id] = ''
                }
              }
            }
          }
        }
      }

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
          case 'hierarchy': {
            const hf = field as HierarchyFieldSchema
            initial[field.id] = Array.from(
              { length: hf.min_rows ?? 3 },
              () => {
                const row: Record<string, string | number | ''> = {}
                for (const col of hf.columns) {
                  row[col.id] = ''
                }
                return row
              }
            )
            break
          }
          case 'computed':
            // Computed fields don't store a value — they compute from others
            break
          case 'formulation':
            // New-format formulation: nested node values
            initial[field.id] = { nodes: {} } as unknown as FieldValue
            break
          case 'record': {
            const rf = field as RecordFieldSchema
            const minRecs = rf.min_records ?? 1
            const emptyRecord: Record<string, Record<string, string | number | ''>> = {}
            for (const group of rf.groups) {
              const gv: Record<string, string | number | ''> = {}
              for (const f of group.fields) {
                gv[f.id] = f.type === 'likert' ? (f.min ?? 0) : ''
              }
              emptyRecord[group.id] = gv
            }
            initial[field.id] = {
              records: Array.from({ length: minRecs }, () =>
                JSON.parse(JSON.stringify(emptyRecord))
              ),
            } as unknown as FieldValue
            break
          }
          case 'number':
            initial[field.id] = ''
            break
          default:
            initial[field.id] = ''
        }
      }
    }

    // Initialize vicious flower petals if schema layout
    if (
      schema.layout === 'formulation_vicious_flower' &&
      initialValues &&
      'petals' in initialValues
    ) {
      initial['petals'] = initialValues['petals'] as FieldValue
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

  // ──────────────────────────────────────────────────────
  // Read-only field renderer
  // ──────────────────────────────────────────────────────

  const renderReadOnlyField = useCallback(
    (field: WorksheetField) => {
      const value = values[field.id]
      const isEmpty =
        value === '' ||
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0)

      switch (field.type) {
        case 'table': {
          const tableField = field as TableFieldSchema
          const rows =
            (value as Record<string, string | number | ''>[]) || []
          const filledRows = rows.filter((row) =>
            Object.values(row).some(
              (v) => v !== '' && v !== undefined && v !== null
            )
          )

          if (filledRows.length === 0) {
            return (
              <div key={field.id} className="space-y-1">
                <p className="text-sm font-medium text-primary-700">
                  {field.label}
                </p>
                <p className="text-sm italic text-primary-400">No entries</p>
              </div>
            )
          }

          return (
            <div key={field.id} className="space-y-2">
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <div className="overflow-x-auto rounded-lg border border-primary-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-200 bg-primary-50">
                      {tableField.columns.map((col) => (
                        <th
                          key={col.id}
                          className="px-3 py-2 text-left font-medium text-primary-600"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {filledRows.map((row, i) => (
                      <tr key={i}>
                        {tableField.columns.map((col) => (
                          <td
                            key={col.id}
                            className="px-3 py-2 text-primary-700"
                          >
                            {row[col.id] !== '' &&
                            row[col.id] !== undefined ? (
                              String(row[col.id])
                            ) : (
                              <span className="text-primary-300">
                                {'\u2014'}
                              </span>
                            )}
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

        case 'hierarchy': {
          const hf = field as HierarchyFieldSchema
          const rows =
            (value as Record<string, string | number | ''>[]) || []
          const filledRows = rows.filter((row) =>
            Object.values(row).some(
              (v) => v !== '' && v !== undefined && v !== null
            )
          )
          const numericCol = hf.columns.find((c) => c.type === 'number')
          const maxVal = numericCol ? (numericCol.max ?? 100) : 100
          const gradient = hf.gradient ?? {
            low: '#e8f5e9',
            mid: '#e4a930',
            high: '#dc2626',
          }

          // Sort for display
          const sortedRows = [...filledRows]
          if (hf.sort_by) {
            sortedRows.sort((a, b) => {
              const va = Number(a[hf.sort_by!]) || 0
              const vb = Number(b[hf.sort_by!]) || 0
              return hf.sort_direction === 'asc' ? va - vb : vb - va
            })
          }

          if (sortedRows.length === 0) {
            return (
              <div key={field.id} className="space-y-1">
                <p className="text-sm font-medium text-primary-700">
                  {field.label}
                </p>
                <p className="text-sm italic text-primary-400">No entries</p>
              </div>
            )
          }

          const interpolate = (
            ratio: number
          ) => {
            const hexToRgb = (hex: string) => [
              parseInt(hex.slice(1, 3), 16),
              parseInt(hex.slice(3, 5), 16),
              parseInt(hex.slice(5, 7), 16),
            ]
            let from: number[], to: number[], t: number
            if (ratio <= 0.5) {
              from = hexToRgb(gradient.low)
              to = hexToRgb(gradient.mid)
              t = ratio * 2
            } else {
              from = hexToRgb(gradient.mid)
              to = hexToRgb(gradient.high)
              t = (ratio - 0.5) * 2
            }
            const r = Math.round(from[0] + (to[0] - from[0]) * t)
            const g = Math.round(from[1] + (to[1] - from[1]) * t)
            const b = Math.round(from[2] + (to[2] - from[2]) * t)
            return `rgb(${r},${g},${b})`
          }

          return (
            <div key={field.id} className="space-y-2">
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <div className="space-y-1.5">
                {sortedRows.map((row, i) => {
                  const numValue = numericCol
                    ? Number(row[numericCol.id]) || 0
                    : 0
                  const ratio = Math.min(numValue / maxVal, 1)
                  const barColor = interpolate(ratio)
                  const barWidth = Math.max(ratio * 100, 2)
                  const textCol = hf.columns.find(
                    (c) => c.type !== 'number'
                  )

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-primary-100 bg-surface p-2.5"
                    >
                      {numericCol && (
                        <span className="w-10 text-center text-sm font-semibold text-primary-800">
                          {numValue}
                        </span>
                      )}
                      {hf.visualisation === 'gradient_bar' && (
                        <div className="relative h-5 w-16 shrink-0 overflow-hidden rounded bg-primary-50">
                          <div
                            className="absolute inset-y-0 left-0 rounded"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      )}
                      <span className="flex-1 text-sm text-primary-700">
                        {textCol
                          ? row[textCol.id] || (
                              <span className="italic text-primary-400">
                                {'\u2014'}
                              </span>
                            )
                          : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        case 'computed': {
          return (
            <ComputedField
              key={field.id}
              field={field as ComputedFieldSchema}
              allValues={values}
            />
          )
        }

        case 'formulation': {
          const ff = field as FormulationFieldSchema
          // Only handle new-format formulations (with nodes array)
          if (ff.nodes && ff.nodes.length > 0) {
            const formulationValues = (values[field.id] as unknown as Record<string, unknown>) || { nodes: {} }
            return (
              <FormulationFieldRenderer
                key={field.id}
                field={ff}
                values={formulationValues}
                onChange={() => {}}
                readOnly
              />
            )
          }
          return null
        }

        case 'record': {
          const rf = field as RecordFieldSchema
          const recordValue = (values[field.id] as unknown as RecordFieldValue) || { records: [] }
          return (
            <RecordFieldRenderer
              key={field.id}
              field={rf}
              value={recordValue}
              onChange={() => {}}
              readOnly
            />
          )
        }

        case 'checklist': {
          const checklistField = field as ChecklistFieldSchema
          const selected = (value as string[]) || []
          const optionMap = new Map(
            checklistField.options.map((o) => [o.id, o.label])
          )

          if (selected.length === 0) {
            return (
              <div key={field.id} className="space-y-1">
                <p className="text-sm font-medium text-primary-700">
                  {field.label}
                </p>
                <p className="text-sm italic text-primary-400">
                  None selected
                </p>
              </div>
            )
          }

          return (
            <div key={field.id} className="space-y-1.5">
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark"
                  >
                    <svg
                      className="h-3 w-3 text-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
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
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-primary-800">
                  {numValue}
                </span>
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
          const selectedOption = selectField.options.find(
            (o) => o.id === value
          )
          return (
            <div key={field.id} className="space-y-1">
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <p className="text-sm text-primary-700">
                {selectedOption ? (
                  selectedOption.label
                ) : isEmpty ? (
                  <span className="italic text-primary-400">Not answered</span>
                ) : (
                  String(value)
                )}
              </p>
            </div>
          )
        }

        case 'textarea': {
          const textValue = String(value || '')
          return (
            <div key={field.id} className="space-y-1">
              {field.label && (
                <p className="text-sm font-medium text-primary-700">
                  {field.label}
                </p>
              )}
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
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <p className="text-sm text-primary-700">
                {dateValue ? (
                  new Date(dateValue + 'T00:00:00').toLocaleDateString(
                    'en-GB',
                    { day: 'numeric', month: 'long', year: 'numeric' }
                  )
                ) : (
                  <span className="italic text-primary-400">Not set</span>
                )}
              </p>
            </div>
          )
        }

        case 'time': {
          const timeValue = value as string
          return (
            <div key={field.id} className="space-y-1">
              <p className="text-sm font-medium text-primary-700">
                {field.label}
              </p>
              <p className="text-sm text-primary-700">
                {timeValue || (
                  <span className="italic text-primary-400">Not set</span>
                )}
              </p>
            </div>
          )
        }

        // text, number, and any other type
        default: {
          return (
            <div key={field.id} className="space-y-1">
              {field.label && (
                <p className="text-sm font-medium text-primary-700">
                  {field.label}
                </p>
              )}
              <p className="text-sm text-primary-700">
                {isEmpty ? (
                  <span className="italic text-primary-400">Not answered</span>
                ) : (
                  String(value)
                )}
              </p>
            </div>
          )
        }
      }
    },
    [values]
  )

  // ──────────────────────────────────────────────────────
  // Interactive field renderer
  // ──────────────────────────────────────────────────────

  const renderField = useCallback(
    (field: WorksheetField) => {
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
              value={
                values[field.id] as Record<string, string | number | ''>[]
              }
              onChange={(v) => updateValue(field.id, v)}
            />
          )
        case 'computed':
          return (
            <ComputedField
              key={field.id}
              field={field as ComputedFieldSchema}
              allValues={values}
            />
          )
        case 'hierarchy':
          return (
            <HierarchyField
              key={field.id}
              field={field as HierarchyFieldSchema}
              value={
                (values[field.id] as Record<
                  string,
                  string | number | ''
                >[]) || []
              }
              onChange={(v) => updateValue(field.id, v)}
            />
          )
        case 'formulation': {
          const ff = field as FormulationFieldSchema
          // Only handle new-format formulations (with nodes array)
          if (ff.nodes && ff.nodes.length > 0) {
            const formulationValues = (values[field.id] as unknown as Record<string, unknown>) || { nodes: {} }
            return (
              <FormulationFieldRenderer
                key={field.id}
                field={ff}
                values={formulationValues}
                onChange={(v) => updateValue(field.id, v as unknown as FieldValue)}
              />
            )
          }
          return null
        }
        case 'record': {
          const rf = field as RecordFieldSchema
          const recordValue = (values[field.id] as unknown as RecordFieldValue) || { records: [] }
          return (
            <RecordFieldRenderer
              key={field.id}
              field={rf}
              value={recordValue}
              onChange={(v) => updateValue(field.id, v as unknown as FieldValue)}
            />
          )
        }
        default:
          return null
      }
    },
    [readOnly, values, updateValue, renderReadOnlyField]
  )

  // ──────────────────────────────────────────────────────
  // Layout-level rendering
  // ──────────────────────────────────────────────────────

  const layout = schema.layout

  // Safety Plan layout
  if (layout === 'safety_plan') {
    if (readOnly) {
      return <SafetyPlanReadOnly sections={schema.sections} renderReadOnlyField={renderReadOnlyField} />
    }
    return <SafetyPlanLayout sections={schema.sections} renderField={renderField} />
  }

  // Decision Tree layout
  if (layout === 'decision_tree') {
    if (readOnly) {
      return (
        <DecisionTreeReadOnly
          sections={schema.sections}
          values={values}
          renderReadOnlyField={renderReadOnlyField}
        />
      )
    }
    return (
      <DecisionTreeLayout
        sections={schema.sections}
        values={values}
        renderField={renderField}
        updateValue={updateValue}
      />
    )
  }

  // Formulation layouts — vicious flower uses the new radial engine for proper flower rendering
  if (layout === 'formulation_vicious_flower') {
    const convertedSchema = convertLegacyFormulation(schema)
    // Find the formulation field in the converted schema
    const formulationSection = convertedSchema.sections.find(s =>
      s.fields.some(f => f.type === 'formulation')
    )
    const formulationField = formulationSection?.fields.find(f => f.type === 'formulation') as FormulationFieldSchema | undefined

    if (formulationField?.nodes && formulationField.nodes.length > 0) {
      // Map legacy values → new nested format: { nodes: { nodeId: { fieldId: value } } }
      const formulationValues: Record<string, unknown> = { nodes: {} }
      const nodeMap: Record<string, Record<string, FieldValue>> = {}
      for (const node of formulationField.nodes) {
        const nodeVals: Record<string, FieldValue> = {}
        for (const field of node.fields) {
          // Legacy values are stored flat: values[sectionId] or values[fieldId]
          // Try matching by node id (which was the section id) then by field id
          const legacyVal = values[field.id] ?? values[`${node.id}_${field.id}`]
          if (legacyVal != null) nodeVals[field.id] = legacyVal as FieldValue
        }
        nodeMap[node.id] = nodeVals
      }
      formulationValues.nodes = nodeMap

      return (
        <div className="mx-auto max-w-4xl">
          <FormulationFieldRenderer
            key="legacy-flower"
            field={formulationField}
            values={formulationValues}
            onChange={(v) => {
              // Map new nested values back to flat legacy storage
              const newNodes = (v as Record<string, unknown>).nodes as Record<string, Record<string, FieldValue>> | undefined
              if (newNodes) {
                const flatValues = { ...values }
                for (const [, nodeFields] of Object.entries(newNodes)) {
                  for (const [fieldId, val] of Object.entries(nodeFields)) {
                    flatValues[fieldId] = val
                  }
                }
                // Update each changed field individually
                for (const [fieldId, val] of Object.entries(flatValues)) {
                  if (val !== values[fieldId]) {
                    updateValue(fieldId, val)
                  }
                }
              }
            }}
            readOnly={readOnly}
          />
        </div>
      )
    }
  }

  // Other formulation layouts — legacy renderer
  if (
    layout === 'formulation_cross_sectional' ||
    layout === 'formulation_longitudinal'
  ) {
    if (readOnly) {
      return (
        <FormulationReadOnly
          layout={layout}
          sections={schema.sections}
          values={values}
          renderReadOnlyField={renderReadOnlyField}
        />
      )
    }
    return (
      <FormulationLayout
        layout={layout}
        sections={schema.sections}
        values={values}
        renderField={renderField}
        updateValue={updateValue}
      />
    )
  }

  // ──────────────────────────────────────────────────────
  // Default layout — standard section-based rendering
  // ──────────────────────────────────────────────────────

  return (
    <div className="space-y-8 print:space-y-6">
      {schema.sections.map((section) => {
        // Handle branch sections inline (decision tree within standard layout)
        if (section.type === 'branch') {
          if (readOnly) {
            return (
              <DecisionTreeReadOnly
                key={section.id}
                sections={[section]}
                values={values}
                renderReadOnlyField={renderReadOnlyField}
              />
            )
          }
          return (
            <DecisionTreeLayout
              key={section.id}
              sections={[section]}
              values={values}
              renderField={renderField}
              updateValue={updateValue}
            />
          )
        }

        return (
          <section key={section.id} className="space-y-4">
            <div>
              {(section.title || section.label) && (
                <h3 className="text-lg font-semibold text-primary-900">
                  {section.title || section.label}
                </h3>
              )}
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
        )
      })}
    </div>
  )
}
