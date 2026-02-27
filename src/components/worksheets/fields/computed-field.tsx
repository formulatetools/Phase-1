'use client'

import type { ComputedField as ComputedFieldType } from '@/types/worksheet'

type CellValue = string | number | ''
type RowData = Record<string, CellValue>

interface Props {
  field: ComputedFieldType
  allValues: Record<string, unknown>
}

/**
 * Resolve a field reference to an array of numeric values.
 * Supported ref formats:
 *   - "fieldId"                         → single top-level value
 *   - "tableId.columnId"                → all row values for that column
 *   - "formulationId.nodeId.fieldId"    → single value from a formulation node
 *   - "recordId.groupId.fieldId"        → values from ALL records for that group/field
 */
function resolveNumericValues(allValues: Record<string, unknown>, fieldRef: string): number[] {
  const parts = fieldRef.split('.')

  // 3-part: disambiguate record (has .records array) vs formulation (has .nodes object)
  if (parts.length === 3) {
    const [parentId, secondId, fieldId] = parts
    const parentData = allValues[parentId] as Record<string, unknown> | undefined
    if (!parentData) return []

    // Record: { records: [{ groupId: { fieldId: value } }, ...] }
    if (Array.isArray(parentData.records)) {
      const records = parentData.records as Record<string, Record<string, unknown>>[]
      return records
        .map((rec) => {
          const val = rec[secondId]?.[fieldId]
          if (val === '' || val === undefined || val === null) return NaN
          return Number(val)
        })
        .filter((v) => !isNaN(v))
    }

    // Formulation: { nodes: { nodeId: { fieldId: value } } }
    const nodesData = parentData.nodes as Record<string, Record<string, unknown>> | undefined
    const val = nodesData?.[secondId]?.[fieldId]
    if (val === '' || val === undefined || val === null) return []
    const num = Number(val)
    return isNaN(num) ? [] : [num]
  }

  // 2-part: table.column → aggregate all rows
  if (parts.length === 2) {
    const [tableId, columnId] = parts
    const tableData = allValues[tableId]
    if (!Array.isArray(tableData)) return []
    return (tableData as RowData[])
      .map((row) => {
        const val = row[columnId]
        if (val === '' || val === undefined || val === null) return NaN
        return Number(val)
      })
      .filter((v) => !isNaN(v))
  }

  // 1-part: simple top-level field value
  const val = allValues[fieldRef]
  if (val === '' || val === undefined || val === null) return []
  const num = Number(val)
  return isNaN(num) ? [] : [num]
}

function compute(field: ComputedFieldType, allValues: Record<string, unknown>): string | null {
  const { computation } = field

  switch (computation.operation) {
    case 'difference': {
      if (!computation.field_a || !computation.field_b) return null
      const valuesA = resolveNumericValues(allValues, computation.field_a)
      const valuesB = resolveNumericValues(allValues, computation.field_b)
      if (valuesA.length === 0 || valuesB.length === 0) return null

      // Average of each column, then difference
      const avgA = valuesA.reduce((s, v) => s + v, 0) / valuesA.length
      const avgB = valuesB.reduce((s, v) => s + v, 0) / valuesB.length
      const diff = avgB - avgA // after - before

      if (computation.format === 'percentage_change') {
        const sign = diff > 0 ? '+' : ''
        return `${sign}${diff.toFixed(0)}% (${avgA.toFixed(0)}% \u2192 ${avgB.toFixed(0)}%)`
      }
      return diff.toFixed(1)
    }

    case 'average': {
      if (!computation.field) return null
      const values = resolveNumericValues(allValues, computation.field)
      if (values.length === 0) return null
      const avg = values.reduce((s, v) => s + v, 0) / values.length
      return avg.toFixed(1)
    }

    case 'sum': {
      if (!computation.field) return null
      const values = resolveNumericValues(allValues, computation.field)
      if (values.length === 0) return null
      const sum = values.reduce((s, v) => s + v, 0)
      return computation.format === 'integer' ? sum.toFixed(0) : sum.toFixed(1)
    }

    case 'count': {
      if (!computation.field) return null
      const [tableId] = computation.field.split('.')
      const tableData = allValues[tableId]
      if (!Array.isArray(tableData)) return null
      const filledRows = (tableData as RowData[]).filter((row) =>
        Object.values(row).some((v) => v !== '' && v !== undefined && v !== null)
      )
      return `${filledRows.length} items`
    }

    default:
      return null
  }
}

export function ComputedField({ field, allValues }: Props) {
  const result = compute(field, allValues)

  return (
    <div className="rounded-lg border-[1.5px] border-dashed border-amber-400 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
          f
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-amber-700">{field.label}</span>
          <span className="text-sm font-semibold text-amber-900">
            {result ?? '\u2014'}
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] leading-tight text-amber-600/70">
        This is a worksheet calculation, not a validated clinical score.
      </p>
    </div>
  )
}
