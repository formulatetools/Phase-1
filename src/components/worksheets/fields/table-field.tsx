'use client'

import type { TableField as TableFieldType, TableColumn } from '@/types/worksheet'

type CellValue = string | number | ''
type RowData = Record<string, CellValue>

interface Props {
  field: TableFieldType
  value: RowData[]
  onChange: (value: RowData[]) => void
}

// Tables with this many columns or more use a card layout on mobile
const CARD_LAYOUT_THRESHOLD = 5

function createEmptyRow(columns: TableColumn[]): RowData {
  const row: RowData = {}
  for (const col of columns) {
    row[col.id] = col.type === 'number' ? '' : ''
  }
  return row
}

export function TableField({ field, value, onChange }: Props) {
  const minRows = field.min_rows ?? 1
  const maxRows = field.max_rows ?? 20

  // Ensure minimum rows
  const rows = value.length >= minRows
    ? value
    : [
        ...value,
        ...Array.from({ length: minRows - value.length }, () =>
          createEmptyRow(field.columns)
        ),
      ]

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

  const renderCell = (col: TableColumn, rowIndex: number, cellValue: CellValue) => {
    const baseClass =
      'w-full border-0 bg-transparent px-2 py-1.5 text-base md:text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-0'
    const cellLabel = `${col.header}, row ${rowIndex + 1}`

    switch (col.type) {
      case 'number':
        return (
          <input
            type="number"
            value={cellValue}
            onChange={(e) =>
              updateCell(
                rowIndex,
                col.id,
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            min={col.min}
            max={col.max}
            step={col.step}
            aria-label={cellLabel}
            className={baseClass}
          />
        )
      case 'textarea':
        return (
          <textarea
            value={cellValue}
            onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
            rows={2}
            aria-label={cellLabel}
            className={`${baseClass} resize-y`}
          />
        )
      default:
        return (
          <input
            type="text"
            value={cellValue}
            onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
            aria-label={cellLabel}
            className={baseClass}
          />
        )
    }
  }

  /** Render a cell input inside a card with proper border and label styling */
  const renderCardCell = (col: TableColumn, rowIndex: number, cellValue: CellValue) => {
    const baseClass =
      'w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-base md:text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30'
    const cellLabel = `${col.header}, row ${rowIndex + 1}`

    switch (col.type) {
      case 'number':
        return (
          <input
            type="number"
            value={cellValue}
            onChange={(e) =>
              updateCell(
                rowIndex,
                col.id,
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            min={col.min}
            max={col.max}
            step={col.step}
            aria-label={cellLabel}
            className={baseClass}
          />
        )
      case 'textarea':
        return (
          <textarea
            value={cellValue}
            onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
            rows={3}
            aria-label={cellLabel}
            className={`${baseClass} resize-y`}
          />
        )
      default:
        return (
          <input
            type="text"
            value={cellValue}
            onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
            aria-label={cellLabel}
            className={baseClass}
          />
        )
    }
  }

  const useCards = field.columns.length >= CARD_LAYOUT_THRESHOLD
  const tableMinWidth = Math.max(600, field.columns.length * 160)

  return (
    <div>
      <label className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>

      {/* ── Mobile card layout (wide tables only, below md) ────────── */}
      {useCards && (
        <div className="mt-2 space-y-3 md:hidden">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded-xl border border-primary-200 bg-surface p-4"
            >
              {/* Card header: row number + delete */}
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-600">
                  Row {rowIndex + 1}
                </span>
                {rows.length > minRows && (
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="rounded-lg p-1.5 text-primary-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label={`Remove row ${rowIndex + 1}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Stacked fields */}
              <div className="space-y-3">
                {field.columns.map((col) => (
                  <div key={col.id}>
                    <label className="mb-1 block text-xs font-medium text-primary-600">
                      {col.header}
                    </label>
                    {renderCardCell(col, rowIndex, row[col.id] ?? '')}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop table (always shown ≥md; for narrow tables, all breakpoints) ── */}
      <div className={`mt-2 overflow-x-auto rounded-lg border border-primary-200 ${useCards ? 'hidden md:block' : ''}`}>
        <table className="w-full" style={{ minWidth: `${tableMinWidth}px` }}>
          <thead>
            <tr className="bg-primary-50">
              <th className="w-10 px-2 py-2 text-xs font-medium text-primary-500">
                #
              </th>
              {field.columns.map((col) => (
                <th
                  key={col.id}
                  className="px-2 py-2 text-left text-xs font-medium text-primary-600"
                >
                  {col.header}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-primary-50/50">
                <td className="px-2 py-1 text-center text-xs text-primary-400">
                  {rowIndex + 1}
                </td>
                {field.columns.map((col) => (
                  <td key={col.id} className="px-1 py-1">
                    {renderCell(col, rowIndex, row[col.id] ?? '')}
                  </td>
                ))}
                <td className="px-1 py-1 text-center">
                  {rows.length > minRows && (
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      className="rounded p-2 text-primary-400 hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove row"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length < maxRows && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-text hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 rounded"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add row
        </button>
      )}
    </div>
  )
}
