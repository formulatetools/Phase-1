'use client'

import { useMemo } from 'react'
import type { HierarchyField as HierarchyFieldType, TableColumn } from '@/types/worksheet'

type CellValue = string | number | ''
type RowData = Record<string, CellValue>

interface Props {
  field: HierarchyFieldType
  value: RowData[]
  onChange: (value: RowData[]) => void
}

function createEmptyRow(columns: TableColumn[]): RowData {
  const row: RowData = {}
  for (const col of columns) {
    row[col.id] = ''
  }
  return row
}

function interpolateColor(low: string, mid: string, high: string, ratio: number): string {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

  let from: number[], to: number[], t: number
  if (ratio <= 0.5) {
    from = hexToRgb(low)
    to = hexToRgb(mid)
    t = ratio * 2
  } else {
    from = hexToRgb(mid)
    to = hexToRgb(high)
    t = (ratio - 0.5) * 2
  }

  const r = Math.round(from[0] + (to[0] - from[0]) * t)
  const g = Math.round(from[1] + (to[1] - from[1]) * t)
  const b = Math.round(from[2] + (to[2] - from[2]) * t)
  return `rgb(${r},${g},${b})`
}

export function HierarchyField({ field, value, onChange }: Props) {
  const minRows = field.min_rows ?? 3
  const maxRows = field.max_rows ?? 15

  const rows =
    value.length >= minRows
      ? value
      : [
          ...value,
          ...Array.from({ length: minRows - value.length }, () =>
            createEmptyRow(field.columns)
          ),
        ]

  const numericCol = field.columns.find((c) => c.type === 'number')
  const maxVal = numericCol ? (numericCol.max ?? 100) : 100

  // Sorted indices for display
  const sortedIndices = useMemo(() => {
    const indices = rows.map((_, i) => i)
    if (!field.sort_by) return indices

    return [...indices].sort((a, b) => {
      const va = Number(rows[a][field.sort_by!]) || 0
      const vb = Number(rows[b][field.sort_by!]) || 0
      return field.sort_direction === 'asc' ? va - vb : vb - va
    })
  }, [rows, field.sort_by, field.sort_direction])

  const gradient = field.gradient ?? {
    low: '#e8f5e9',
    mid: '#e4a930',
    high: '#dc2626',
  }

  const updateCell = (rowIndex: number, colId: string, cellValue: CellValue) => {
    const updated = rows.map((row, i) =>
      i === rowIndex ? { ...row, [colId]: cellValue } : row
    )
    onChange(updated)
  }

  const addRow = () => {
    if (rows.length < maxRows) {
      onChange([...rows, createEmptyRow(field.columns)])
    }
  }

  const removeRow = (index: number) => {
    if (rows.length > minRows) {
      onChange(rows.filter((_, i) => i !== index))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <div className="mt-3 space-y-2">
        {sortedIndices.map((originalIndex) => {
          const row = rows[originalIndex]
          const numValue = numericCol
            ? Number(row[numericCol.id]) || 0
            : 0
          const ratio = Math.min(numValue / maxVal, 1)
          const barColor = interpolateColor(
            gradient.low,
            gradient.mid,
            gradient.high,
            ratio
          )
          const barWidth = Math.max(ratio * 100, 2)

          return (
            <div
              key={originalIndex}
              className="group flex items-center gap-3 rounded-lg border border-primary-100 bg-surface p-3 transition-shadow hover:shadow-sm"
            >
              {/* SUDS value input */}
              {numericCol && (
                <div className="w-16 shrink-0">
                  <input
                    type="number"
                    value={row[numericCol.id]}
                    onChange={(e) =>
                      updateCell(
                        originalIndex,
                        numericCol.id,
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    min={numericCol.min}
                    max={numericCol.max}
                    className="w-full rounded border border-primary-200 px-2 py-1.5 text-center text-sm font-semibold text-primary-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                    placeholder="0"
                  />
                </div>
              )}

              {/* Gradient bar */}
              {field.visualisation === 'gradient_bar' && (
                <div className="relative h-6 w-20 shrink-0 overflow-hidden rounded bg-primary-50">
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              )}

              {/* Text fields */}
              <div className="min-w-0 flex-1">
                {field.columns
                  .filter((c) => c.type !== 'number')
                  .map((col) => (
                    <div key={col.id}>
                      {col.type === 'textarea' ? (
                        <textarea
                          value={row[col.id]}
                          onChange={(e) =>
                            updateCell(originalIndex, col.id, e.target.value)
                          }
                          placeholder={col.header}
                          rows={1}
                          className="w-full resize-none border-0 bg-transparent p-0 text-sm text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-0"
                        />
                      ) : (
                        <input
                          type="text"
                          value={row[col.id]}
                          onChange={(e) =>
                            updateCell(originalIndex, col.id, e.target.value)
                          }
                          placeholder={col.header}
                          className="w-full border-0 bg-transparent p-0 text-sm text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-0"
                        />
                      )}
                    </div>
                  ))}
              </div>

              {/* Remove button */}
              {rows.length > minRows && (
                <button
                  type="button"
                  onClick={() => removeRow(originalIndex)}
                  className="shrink-0 text-primary-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="Remove step"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {rows.length < maxRows && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add step
        </button>
      )}
    </div>
  )
}
