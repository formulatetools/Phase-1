'use client'

import type { WorksheetField, LikertField, ChecklistField, SelectField, TableField, NumberField, ComputedField } from '@/types/worksheet'

interface FieldEditorProps {
  field: WorksheetField
  index: number
  totalFields: number
  allNumberFieldIds: { id: string; label: string }[]
  onUpdate: (field: WorksheetField) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  textarea: 'Text Area',
  number: 'Number',
  likert: 'Scale / Slider',
  checklist: 'Checklist',
  select: 'Dropdown',
  date: 'Date',
  time: 'Time',
  table: 'Table',
  computed: 'Calculation',
}

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'bg-primary-100 text-primary-600',
  textarea: 'bg-primary-100 text-primary-600',
  number: 'bg-blue-50 text-blue-600',
  likert: 'bg-purple-50 text-purple-600',
  checklist: 'bg-green-50 text-green-600',
  select: 'bg-green-50 text-green-600',
  date: 'bg-amber-50 text-amber-600',
  time: 'bg-amber-50 text-amber-600',
  table: 'bg-indigo-50 text-indigo-600',
  computed: 'bg-brand/10 text-brand-dark',
}

export function FieldEditor({
  field,
  index,
  totalFields,
  allNumberFieldIds,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: FieldEditorProps) {
  const updateProp = (key: string, value: unknown) => {
    onUpdate({ ...field, [key]: value } as WorksheetField)
  }

  return (
    <div className="rounded-xl border border-primary-100 bg-surface p-4">
      {/* Field header */}
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${FIELD_TYPE_COLORS[field.type] || 'bg-primary-50 text-primary-500'}`}>
          {FIELD_TYPE_LABELS[field.type] || field.type}
        </span>
        <span className="flex-1 truncate text-xs font-medium text-primary-500">{field.label || 'Untitled field'}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="rounded p-1 text-primary-300 hover:bg-primary-50 hover:text-primary-500 disabled:opacity-30" title="Move up">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={index === totalFields - 1} className="rounded p-1 text-primary-300 hover:bg-primary-50 hover:text-primary-500 disabled:opacity-30" title="Move down">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <button onClick={onRemove} className="rounded p-1 text-primary-300 hover:bg-red-50 hover:text-red-500" title="Remove field">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Common fields */}
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-[11px] font-medium text-primary-500">Label *</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateProp('label', e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Field label"
          />
        </div>

        {field.type !== 'computed' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-primary-500">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateProp('placeholder', e.target.value || undefined)}
                className="mt-0.5 w-full rounded-lg border border-primary-200 px-3 py-1.5 text-sm text-primary-800 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Optional"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-primary-600">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => updateProp('required', e.target.checked)}
                  className="h-4 w-4 rounded border-primary-300 text-brand focus:ring-brand"
                />
                Required
              </label>
            </div>
          </div>
        )}

        {/* Type-specific configuration */}
        {field.type === 'number' && <NumberConfig field={field as NumberField} onUpdate={onUpdate} />}
        {field.type === 'likert' && <LikertConfig field={field as LikertField} onUpdate={onUpdate} />}
        {(field.type === 'checklist' || field.type === 'select') && (
          <OptionsConfig field={field as ChecklistField | SelectField} onUpdate={onUpdate} />
        )}
        {field.type === 'table' && <TableConfig field={field as TableField} onUpdate={onUpdate} />}
        {field.type === 'computed' && (
          <ComputedConfig field={field as ComputedField} allNumberFieldIds={allNumberFieldIds} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

// ── Number config ──────────────────────────────────────────────────────────
function NumberConfig({ field, onUpdate }: { field: NumberField; onUpdate: (f: WorksheetField) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="text-[11px] font-medium text-primary-500">Min</label>
        <input type="number" value={field.min ?? ''} onChange={(e) => onUpdate({ ...field, min: e.target.value ? Number(e.target.value) : undefined } as WorksheetField)} className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm" placeholder="0" />
      </div>
      <div>
        <label className="text-[11px] font-medium text-primary-500">Max</label>
        <input type="number" value={field.max ?? ''} onChange={(e) => onUpdate({ ...field, max: e.target.value ? Number(e.target.value) : undefined } as WorksheetField)} className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm" placeholder="100" />
      </div>
      <div>
        <label className="text-[11px] font-medium text-primary-500">Step</label>
        <input type="number" value={field.step ?? ''} onChange={(e) => onUpdate({ ...field, step: e.target.value ? Number(e.target.value) : undefined } as WorksheetField)} className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm" placeholder="1" />
      </div>
    </div>
  )
}

// ── Likert config ──────────────────────────────────────────────────────────
function LikertConfig({ field, onUpdate }: { field: LikertField; onUpdate: (f: WorksheetField) => void }) {
  const anchors = field.anchors || {}
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-medium text-primary-500">Min</label>
          <input type="number" value={field.min ?? 0} onChange={(e) => onUpdate({ ...field, min: Number(e.target.value) } as WorksheetField)} className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-primary-500">Max</label>
          <input type="number" value={field.max ?? 10} onChange={(e) => onUpdate({ ...field, max: Number(e.target.value) } as WorksheetField)} className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-primary-500">Step</label>
          <input type="number" value={field.step ?? 1} onChange={(e) => onUpdate({ ...field, step: Number(e.target.value) } as WorksheetField)} className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-medium text-primary-500">Anchors (labels at scale points)</label>
        <div className="mt-1 space-y-1">
          {Object.entries(anchors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <input type="number" value={key} readOnly className="w-14 rounded border border-primary-200 px-2 py-1 text-xs text-center" />
              <input
                type="text"
                value={val as string}
                onChange={(e) => {
                  const newAnchors = { ...anchors, [key]: e.target.value }
                  onUpdate({ ...field, anchors: newAnchors } as WorksheetField)
                }}
                className="flex-1 rounded border border-primary-200 px-2 py-1 text-xs"
                placeholder="Label"
              />
              <button
                onClick={() => {
                  const newAnchors = { ...anchors }
                  delete newAnchors[key]
                  onUpdate({ ...field, anchors: newAnchors } as WorksheetField)
                }}
                className="text-primary-300 hover:text-red-500"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const nextKey = String(field.max ?? 10)
              onUpdate({ ...field, anchors: { ...anchors, [nextKey]: '' } } as WorksheetField)
            }}
            className="text-xs text-brand hover:text-brand-dark"
          >
            + Add anchor
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Checklist / Select options config ──────────────────────────────────────
function OptionsConfig({ field, onUpdate }: { field: ChecklistField | SelectField; onUpdate: (f: WorksheetField) => void }) {
  const options = field.options || []
  return (
    <div>
      <label className="text-[11px] font-medium text-primary-500">Options</label>
      <div className="mt-1 space-y-1">
        {options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="text"
              value={opt.label}
              onChange={(e) => {
                const newOpts = [...options]
                newOpts[i] = { ...opt, label: e.target.value }
                onUpdate({ ...field, options: newOpts } as WorksheetField)
              }}
              className="flex-1 rounded border border-primary-200 px-2 py-1 text-xs"
              placeholder={`Option ${i + 1}`}
            />
            <button
              onClick={() => {
                onUpdate({ ...field, options: options.filter((_, j) => j !== i) } as WorksheetField)
              }}
              className="text-primary-300 hover:text-red-500"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newOpt = { id: `opt-${Date.now()}`, label: '' }
            onUpdate({ ...field, options: [...options, newOpt] } as WorksheetField)
          }}
          className="text-xs text-brand hover:text-brand-dark"
        >
          + Add option
        </button>
      </div>
    </div>
  )
}

// ── Table columns config ──────────────────────────────────────────────────
function TableConfig({ field, onUpdate }: { field: TableField; onUpdate: (f: WorksheetField) => void }) {
  const columns = field.columns || []
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-primary-500">Columns</label>
      <div className="space-y-2">
        {columns.map((col, i) => (
          <div key={col.id} className="flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-25 p-2">
            <input
              type="text"
              value={col.header}
              onChange={(e) => {
                const newCols = [...columns]
                newCols[i] = { ...col, header: e.target.value }
                onUpdate({ ...field, columns: newCols } as WorksheetField)
              }}
              className="flex-1 rounded border border-primary-200 px-2 py-1 text-xs"
              placeholder="Column header"
            />
            <select
              value={col.type}
              onChange={(e) => {
                const newCols = [...columns]
                newCols[i] = { ...col, type: e.target.value as 'text' | 'textarea' | 'number' }
                onUpdate({ ...field, columns: newCols } as WorksheetField)
              }}
              className="rounded border border-primary-200 px-2 py-1 text-xs"
            >
              <option value="text">Text</option>
              <option value="textarea">Text Area</option>
              <option value="number">Number</option>
            </select>
            <button
              onClick={() => {
                onUpdate({ ...field, columns: columns.filter((_, j) => j !== i) } as WorksheetField)
              }}
              className="text-primary-300 hover:text-red-500"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newCol = { id: `col-${Date.now()}`, header: '', type: 'text' as const }
            onUpdate({ ...field, columns: [...columns, newCol] } as WorksheetField)
          }}
          className="text-xs text-brand hover:text-brand-dark"
        >
          + Add column
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-medium text-primary-500">Min rows</label>
          <input type="number" value={field.min_rows ?? 1} min={1} onChange={(e) => onUpdate({ ...field, min_rows: Number(e.target.value) } as WorksheetField)} className="mt-0.5 w-full rounded border border-primary-200 px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-primary-500">Max rows</label>
          <input type="number" value={field.max_rows ?? 10} min={1} onChange={(e) => onUpdate({ ...field, max_rows: Number(e.target.value) } as WorksheetField)} className="mt-0.5 w-full rounded border border-primary-200 px-2 py-1 text-xs" />
        </div>
      </div>
    </div>
  )
}

// ── Computed field config ──────────────────────────────────────────────────
function ComputedConfig({
  field,
  allNumberFieldIds,
  onUpdate,
}: {
  field: ComputedField
  allNumberFieldIds: { id: string; label: string }[]
  onUpdate: (f: WorksheetField) => void
}) {
  const computation = field.computation || { operation: 'sum', fields: [] }
  const operation = computation.operation || 'sum'

  const isTwoField = operation === 'difference' || operation === 'percentage_change'

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-brand/30 bg-brand/5 p-3">
      <p className="text-[10px] text-primary-400">
        Computed values are worksheet-level calculations. Remind clients they are not validated clinical scores.
      </p>
      <div>
        <label className="text-[11px] font-medium text-primary-500">Operation</label>
        <select
          value={operation}
          onChange={(e) => {
            onUpdate({ ...field, computation: { ...computation, operation: e.target.value } } as WorksheetField)
          }}
          className="mt-0.5 w-full rounded-lg border border-primary-200 px-2 py-1.5 text-sm"
        >
          <option value="sum">Sum</option>
          <option value="average">Average</option>
          <option value="count">Count</option>
          <option value="min">Minimum</option>
          <option value="max">Maximum</option>
          <option value="difference">Difference (A - B)</option>
          <option value="percentage_change">Percentage Change</option>
        </select>
      </div>

      {isTwoField ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-primary-500">Field A</label>
            <select
              value={computation.field_a || ''}
              onChange={(e) => onUpdate({ ...field, computation: { ...computation, field_a: e.target.value } } as WorksheetField)}
              className="mt-0.5 w-full rounded border border-primary-200 px-2 py-1.5 text-xs"
            >
              <option value="">Select field...</option>
              {allNumberFieldIds.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-primary-500">Field B</label>
            <select
              value={computation.field_b || ''}
              onChange={(e) => onUpdate({ ...field, computation: { ...computation, field_b: e.target.value } } as WorksheetField)}
              className="mt-0.5 w-full rounded border border-primary-200 px-2 py-1.5 text-xs"
            >
              <option value="">Select field...</option>
              {allNumberFieldIds.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="text-[11px] font-medium text-primary-500">Source fields</label>
          <div className="mt-1 space-y-1">
            {allNumberFieldIds.map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-xs text-primary-600">
                <input
                  type="checkbox"
                  checked={(computation.fields || []).includes(f.id)}
                  onChange={(e) => {
                    const fields = computation.fields || []
                    const newFields = e.target.checked
                      ? [...fields, f.id]
                      : fields.filter((id: string) => id !== f.id)
                    onUpdate({ ...field, computation: { ...computation, fields: newFields } } as WorksheetField)
                  }}
                  className="h-3.5 w-3.5 rounded border-primary-300 text-brand focus:ring-brand"
                />
                {f.label}
              </label>
            ))}
            {allNumberFieldIds.length === 0 && (
              <p className="text-xs text-primary-400">Add number fields first to use in calculations</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
