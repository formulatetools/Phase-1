'use client'

import { useState } from 'react'
import type {
  RecordField as RecordFieldType,
  RecordGroup,
  RecordSubField,
} from '@/types/worksheet'

// ─── Value shape ───────────────────────────────────────
// values[field.id] = { records: [{ groupId: { fieldId: value } }, ...] }
type SubFieldValue = string | number | '' | string[]
type RecordEntry = Record<string, Record<string, SubFieldValue>>
export interface RecordFieldValue {
  records: RecordEntry[]
}

interface Props {
  field: RecordFieldType
  value: RecordFieldValue
  onChange: (value: RecordFieldValue) => void
  readOnly?: boolean
}

// ─── Helpers ───────────────────────────────────────────

function createEmptyRecord(groups: RecordGroup[]): RecordEntry {
  const record: RecordEntry = {}
  for (const group of groups) {
    const groupVals: Record<string, SubFieldValue> = {}
    for (const f of group.fields) {
      switch (f.type) {
        case 'likert':
          groupVals[f.id] = f.min ?? 0
          break
        case 'checklist':
          groupVals[f.id] = []
          break
        case 'number':
          groupVals[f.id] = ''
          break
        default:
          groupVals[f.id] = ''
      }
    }
    record[group.id] = groupVals
  }
  return record
}

// ─── Sub-field renderer ────────────────────────────────

function RecordSubFieldRenderer({
  subField,
  value,
  onChange,
  readOnly,
  compact,
}: {
  subField: RecordSubField
  value: SubFieldValue
  onChange: (v: SubFieldValue) => void
  readOnly?: boolean
  compact?: boolean
}) {
  const baseInputClass =
    'w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-base md:text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30'

  if (readOnly) {
    return <RecordSubFieldReadOnly subField={subField} value={value} />
  }

  switch (subField.type) {
    case 'textarea':
      return (
        <div>
          {subField.label && (
            <label className="mb-1 block text-xs font-medium text-primary-500">
              {subField.label}
            </label>
          )}
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={subField.placeholder}
            rows={compact ? 3 : 4}
            className={`${baseInputClass} resize-y`}
          />
        </div>
      )

    case 'text':
      return (
        <div>
          {subField.label && (
            <label className="mb-1 block text-xs font-medium text-primary-500">
              {subField.label}
            </label>
          )}
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={subField.placeholder}
            className={baseInputClass}
          />
        </div>
      )

    case 'number':
      return (
        <div>
          {subField.label && (
            <label className="mb-1 block text-xs font-medium text-primary-500">
              {subField.label}
            </label>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value as number | ''}
              onChange={(e) =>
                onChange(e.target.value === '' ? '' : Number(e.target.value))
              }
              min={subField.min}
              max={subField.max}
              step={subField.step}
              placeholder={subField.placeholder}
              className={baseInputClass}
            />
            {subField.suffix && (
              <span className="shrink-0 text-xs text-primary-400">
                {subField.suffix}
              </span>
            )}
          </div>
        </div>
      )

    case 'likert': {
      const min = subField.min ?? 0
      const max = subField.max ?? 100
      const step = subField.step ?? 1
      const numVal = typeof value === 'number' ? value : min
      const anchors = subField.anchors || {}

      return (
        <div>
          {subField.label && (
            <label className="mb-1 block text-xs font-medium text-primary-500">
              {subField.label}
            </label>
          )}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={numVal}
              onChange={(e) => onChange(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-primary-200 accent-brand [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
            />
            <span className="w-10 text-right text-sm font-semibold text-primary-800">
              {numVal}
              {subField.suffix || '%'}
            </span>
          </div>
          {Object.keys(anchors).length > 0 && (
            <div className="mt-0.5 flex justify-between text-[10px] text-primary-400">
              {Object.entries(anchors).map(([val, label]) => (
                <span key={val}>{label}</span>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'checklist': {
      const selected = (value as string[]) || []
      const options = subField.options || []
      return (
        <div>
          {subField.label && (
            <label className="mb-1 block text-xs font-medium text-primary-500">
              {subField.label}
            </label>
          )}
          <div className="space-y-1">
            {options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-sm text-primary-700"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, opt.id])
                    } else {
                      onChange(selected.filter((id) => id !== opt.id))
                    }
                  }}
                  className="rounded border-primary-300 text-brand focus:ring-brand/30"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )
    }

    case 'select': {
      const options = subField.options || []
      return (
        <div>
          {subField.label && (
            <label className="mb-1 block text-xs font-medium text-primary-500">
              {subField.label}
            </label>
          )}
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          >
            <option value="">{subField.placeholder || 'Select...'}</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Sub-field read-only ───────────────────────────────

function RecordSubFieldReadOnly({
  subField,
  value,
}: {
  subField: RecordSubField
  value: SubFieldValue
}) {
  const isEmpty =
    value === '' || value === undefined || value === null ||
    (Array.isArray(value) && value.length === 0)

  switch (subField.type) {
    case 'textarea':
    case 'text': {
      const textVal = String(value || '')
      return (
        <div>
          {subField.label && (
            <p className="text-xs font-medium text-primary-500">
              {subField.label}
            </p>
          )}
          {textVal ? (
            <p className="whitespace-pre-wrap text-sm text-primary-700">
              {textVal}
            </p>
          ) : (
            <p className="text-sm italic text-primary-400">&mdash;</p>
          )}
        </div>
      )
    }

    case 'number': {
      return (
        <div>
          {subField.label && (
            <p className="text-xs font-medium text-primary-500">
              {subField.label}
            </p>
          )}
          <p className="text-sm text-primary-700">
            {isEmpty ? (
              <span className="italic text-primary-400">&mdash;</span>
            ) : (
              <>
                {String(value)}
                {subField.suffix && (
                  <span className="ml-0.5 text-primary-400">
                    {subField.suffix}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      )
    }

    case 'likert': {
      const numVal = typeof value === 'number' ? value : 0
      const max = subField.max ?? 100
      const ratio = Math.min(numVal / max, 1)
      return (
        <div>
          {subField.label && (
            <p className="text-xs font-medium text-primary-500">
              {subField.label}
            </p>
          )}
          <div className="flex items-center gap-2">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-primary-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-brand"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-primary-800">
              {numVal}{subField.suffix || '%'}
            </span>
          </div>
        </div>
      )
    }

    case 'checklist': {
      const selected = (value as string[]) || []
      const options = subField.options || []
      if (selected.length === 0) {
        return (
          <div>
            {subField.label && (
              <p className="text-xs font-medium text-primary-500">
                {subField.label}
              </p>
            )}
            <p className="text-sm italic text-primary-400">&mdash;</p>
          </div>
        )
      }
      const optMap = new Map(options.map((o) => [o.id, o.label]))
      return (
        <div>
          {subField.label && (
            <p className="text-xs font-medium text-primary-500">
              {subField.label}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {selected.map((id) => (
              <span
                key={id}
                className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark"
              >
                {optMap.get(id) || id}
              </span>
            ))}
          </div>
        </div>
      )
    }

    case 'select': {
      const options = subField.options || []
      const opt = options.find((o) => o.id === value)
      return (
        <div>
          {subField.label && (
            <p className="text-xs font-medium text-primary-500">
              {subField.label}
            </p>
          )}
          <p className="text-sm text-primary-700">
            {opt ? opt.label : isEmpty ? (
              <span className="italic text-primary-400">&mdash;</span>
            ) : String(value)}
          </p>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Group column ──────────────────────────────────────

function RecordGroupColumn({
  group,
  values,
  onChange,
  readOnly,
}: {
  group: RecordGroup
  values: Record<string, SubFieldValue>
  onChange: (fieldId: string, value: SubFieldValue) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="border-b border-primary-100 pb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
        {group.header}
      </h4>
      <div className="flex flex-col gap-3">
        {group.fields.map((subField) => (
          <RecordSubFieldRenderer
            key={subField.id}
            subField={subField}
            value={values[subField.id] ?? ''}
            onChange={(v) => onChange(subField.id, v)}
            readOnly={readOnly}
            compact
          />
        ))}
      </div>
    </div>
  )
}

// ─── Record card ───────────────────────────────────────

// Max columns per row before groups wrap to a new row
const MAX_RECORD_COLS = 3

/** Split an array into chunks of a given size */
function chunkGroups(groups: RecordGroup[], maxCols: number): RecordGroup[][] {
  const rows: RecordGroup[][] = []
  for (let i = 0; i < groups.length; i += maxCols) {
    rows.push(groups.slice(i, i + maxCols))
  }
  return rows
}

/** Build grid-template-columns string for a row of groups */
function buildGridCols(rowGroups: RecordGroup[]): string {
  return rowGroups
    .map((g) => {
      switch (g.width) {
        case 'narrow':
          return 'minmax(0, 0.7fr)'
        case 'wide':
          return 'minmax(0, 1.5fr)'
        default:
          return 'minmax(0, 1fr)'
      }
    })
    .join(' ')
}

function RecordCard({
  groups,
  record,
  onChange,
  readOnly,
}: {
  groups: RecordGroup[]
  record: RecordEntry
  onChange: (groupId: string, fieldId: string, value: SubFieldValue) => void
  readOnly?: boolean
}) {
  // Split groups into rows of max MAX_RECORD_COLS so they don't squash on A4/PDF
  const rows = chunkGroups(groups, MAX_RECORD_COLS)

  return (
    <div className="rounded-2xl border border-primary-200 bg-surface p-4 md:p-5">
      {/* Desktop: multi-row grid (each row has its own column template) */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        {rows.map((rowGroups, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-4"
            style={{ gridTemplateColumns: buildGridCols(rowGroups) }}
          >
            {rowGroups.map((group) => (
              <RecordGroupColumn
                key={group.id}
                group={group}
                values={record[group.id] || {}}
                onChange={(fieldId, value) => onChange(group.id, fieldId, value)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: stacked */}
      <div className="flex flex-col gap-5 md:hidden">
        {groups.map((group) => (
          <RecordGroupColumn
            key={group.id}
            group={group}
            values={record[group.id] || {}}
            onChange={(fieldId, value) => onChange(group.id, fieldId, value)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Pagination bar ────────────────────────────────────

function RecordPaginationBar({
  currentIndex,
  total,
  maxRecords,
  minRecords,
  onPrev,
  onNext,
  onAdd,
  onDelete,
  readOnly,
}: {
  currentIndex: number
  total: number
  maxRecords: number
  minRecords: number
  onPrev: () => void
  onNext: () => void
  onAdd: () => void
  onDelete: () => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex <= 0}
          className="rounded-lg border border-primary-200 p-1.5 text-primary-500 transition-colors hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Previous record"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="min-w-[80px] text-center text-sm font-medium text-primary-600">
          Record {currentIndex + 1} of {total}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentIndex >= total - 1}
          className="rounded-lg border border-primary-200 p-1.5 text-primary-500 transition-colors hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Next record"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2">
          {total > minRecords && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
              aria-label="Delete this record"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Delete
            </button>
          )}
          {total < maxRecords && (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1 rounded-lg border border-brand/30 px-2.5 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:bg-brand/5"
              aria-label="Add record"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add record
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────

export function RecordFieldRenderer({ field, value, onChange, readOnly }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const minRecords = field.min_records ?? 1
  const maxRecords = field.max_records ?? 20
  const records = value?.records || []

  // Ensure minimum records exist
  const ensuredRecords =
    records.length >= minRecords
      ? records
      : [
          ...records,
          ...Array.from({ length: minRecords - records.length }, () =>
            createEmptyRecord(field.groups)
          ),
        ]

  const total = ensuredRecords.length

  const handleSubFieldChange = (
    groupId: string,
    fieldId: string,
    subValue: SubFieldValue
  ) => {
    const updated = ensuredRecords.map((rec, i) => {
      if (i !== currentIndex) return rec
      return {
        ...rec,
        [groupId]: {
          ...(rec[groupId] || {}),
          [fieldId]: subValue,
        },
      }
    })
    onChange({ records: updated })
  }

  const handleAdd = () => {
    if (total < maxRecords) {
      const newRecords = [...ensuredRecords, createEmptyRecord(field.groups)]
      onChange({ records: newRecords })
      setCurrentIndex(newRecords.length - 1)
    }
  }

  const handleDelete = () => {
    if (total > minRecords) {
      const newRecords = ensuredRecords.filter((_, i) => i !== currentIndex)
      onChange({ records: newRecords })
      setCurrentIndex(Math.min(currentIndex, newRecords.length - 1))
    }
  }

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const handleNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1))

  // Clamp index if records were removed externally
  const safeIndex = Math.min(currentIndex, total - 1)
  const currentRecord = ensuredRecords[safeIndex] || createEmptyRecord(field.groups)

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-sm font-medium text-primary-700">
          {field.label}
          {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      </div>

      <RecordPaginationBar
        currentIndex={safeIndex}
        total={total}
        maxRecords={maxRecords}
        minRecords={minRecords}
        onPrev={handlePrev}
        onNext={handleNext}
        onAdd={handleAdd}
        onDelete={handleDelete}
        readOnly={readOnly}
      />

      <RecordCard
        groups={field.groups}
        record={currentRecord}
        onChange={handleSubFieldChange}
        readOnly={readOnly}
      />

      {/* Dot indicators for quick navigation */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 pt-1">
          {ensuredRecords.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === safeIndex
                  ? 'bg-brand'
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={`Go to record ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
