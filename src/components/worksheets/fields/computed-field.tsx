'use client'

import type { ComputedField as ComputedFieldType } from '@/types/worksheet'

type CellValue = string | number | ''
type RowData = Record<string, CellValue>

interface Props {
  field: ComputedFieldType
  allValues: Record<string, unknown>
}

function getTableColumnValues(allValues: Record<string, unknown>, fieldRef: string): number[] {
  const [tableId, columnId] = fieldRef.split('.')
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

function compute(field: ComputedFieldType, allValues: Record<string, unknown>): string | null {
  const { computation } = field

  switch (computation.operation) {
    case 'difference': {
      if (!computation.field_a || !computation.field_b) return null
      const valuesA = getTableColumnValues(allValues, computation.field_a)
      const valuesB = getTableColumnValues(allValues, computation.field_b)
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
      const values = getTableColumnValues(allValues, computation.field)
      if (values.length === 0) return null
      const avg = values.reduce((s, v) => s + v, 0) / values.length
      return avg.toFixed(1)
    }

    case 'sum': {
      if (!computation.field) return null
      const values = getTableColumnValues(allValues, computation.field)
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
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
          f
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-amber-700">{field.label}</span>
          <span className="text-sm font-semibold text-amber-900">
            {result ?? '\u2014'}
          </span>
        </div>
      </div>
    </div>
  )
}
