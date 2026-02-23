'use client'

import { useState } from 'react'
import type { WorksheetSection, WorksheetField, CustomFieldType } from '@/types/worksheet'
import { FieldEditor } from './field-editor'

interface SectionEditorProps {
  section: WorksheetSection
  index: number
  totalSections: number
  allNumberFieldIds: { id: string; label: string }[]
  onUpdate: (section: WorksheetSection) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const FIELD_TYPES: { type: CustomFieldType; label: string; description: string }[] = [
  { type: 'text', label: 'Text', description: 'Single-line text input' },
  { type: 'textarea', label: 'Text Area', description: 'Multi-line text input' },
  { type: 'number', label: 'Number', description: 'Numeric input with min/max' },
  { type: 'likert', label: 'Scale / Slider', description: 'Rating scale with anchors' },
  { type: 'checklist', label: 'Checklist', description: 'Multiple choice (multi-select)' },
  { type: 'select', label: 'Dropdown', description: 'Single choice dropdown' },
  { type: 'date', label: 'Date', description: 'Date picker' },
  { type: 'time', label: 'Time', description: 'Time picker' },
  { type: 'table', label: 'Table', description: 'Dynamic rows with columns' },
  { type: 'computed', label: 'Calculation', description: 'Auto-computed from other fields' },
]

function createDefaultField(type: CustomFieldType): WorksheetField {
  const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const base = { id, label: '', required: false }

  switch (type) {
    case 'text':
      return { ...base, type: 'text' }
    case 'textarea':
      return { ...base, type: 'textarea' }
    case 'number':
      return { ...base, type: 'number', min: 0, max: 100, step: 1 }
    case 'likert':
      return { ...base, type: 'likert', min: 0, max: 10, step: 1, anchors: { '0': 'Not at all', '10': 'Extremely' } }
    case 'checklist':
      return { ...base, type: 'checklist', options: [{ id: 'opt-1', label: '' }] }
    case 'select':
      return { ...base, type: 'select', options: [{ id: 'opt-1', label: '' }] }
    case 'date':
      return { ...base, type: 'date' }
    case 'time':
      return { ...base, type: 'time' }
    case 'table':
      return {
        ...base,
        type: 'table',
        columns: [{ id: 'col-1', header: '', type: 'text' as const }],
        min_rows: 1,
        max_rows: 10,
      }
    case 'computed':
      return {
        ...base,
        type: 'computed',
        computation: { operation: 'sum', fields: [] },
      } as WorksheetField
    default:
      return { ...base, type: 'text' }
  }
}

export function SectionEditor({
  section,
  index,
  totalSections,
  allNumberFieldIds,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SectionEditorProps) {
  const [showFieldPicker, setShowFieldPicker] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const updateField = (fieldIndex: number, field: WorksheetField) => {
    const newFields = [...section.fields]
    newFields[fieldIndex] = field
    onUpdate({ ...section, fields: newFields })
  }

  const removeField = (fieldIndex: number) => {
    onUpdate({ ...section, fields: section.fields.filter((_, i) => i !== fieldIndex) })
  }

  const moveField = (from: number, to: number) => {
    const newFields = [...section.fields]
    const [moved] = newFields.splice(from, 1)
    newFields.splice(to, 0, moved)
    onUpdate({ ...section, fields: newFields })
  }

  const addField = (type: CustomFieldType) => {
    const field = createDefaultField(type)
    onUpdate({ ...section, fields: [...section.fields, field] })
    setShowFieldPicker(false)
  }

  return (
    <div className="rounded-2xl border border-primary-200 bg-primary-25 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-primary-100 bg-surface px-4 py-3">
        <button onClick={() => setCollapsed(!collapsed)} className="text-primary-400 hover:text-primary-600">
          <svg className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">Section {index + 1}</span>
        <input
          type="text"
          value={section.title || ''}
          onChange={(e) => onUpdate({ ...section, title: e.target.value })}
          className="flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-sm font-semibold text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-1 focus:ring-brand focus:rounded"
          placeholder="Section title"
        />
        <div className="flex items-center gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="rounded p-1 text-primary-300 hover:bg-primary-50 hover:text-primary-500 disabled:opacity-30" title="Move section up">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={index === totalSections - 1} className="rounded p-1 text-primary-300 hover:bg-primary-50 hover:text-primary-500 disabled:opacity-30" title="Move section down">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <button onClick={onRemove} className="rounded p-1 text-primary-300 hover:bg-red-50 hover:text-red-500" title="Remove section">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3 p-4">
          {/* Section description */}
          <input
            type="text"
            value={section.description || ''}
            onChange={(e) => onUpdate({ ...section, description: e.target.value })}
            className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-1.5 text-sm text-primary-600 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Section description (optional)"
          />

          {/* Fields */}
          <div className="space-y-2">
            {section.fields.map((field, fi) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={fi}
                totalFields={section.fields.length}
                allNumberFieldIds={allNumberFieldIds}
                onUpdate={(f) => updateField(fi, f)}
                onRemove={() => removeField(fi)}
                onMoveUp={() => fi > 0 && moveField(fi, fi - 1)}
                onMoveDown={() => fi < section.fields.length - 1 && moveField(fi, fi + 1)}
              />
            ))}
          </div>

          {/* Add field */}
          {showFieldPicker ? (
            <div className="rounded-xl border border-brand/20 bg-surface p-3">
              <p className="mb-2 text-xs font-semibold text-primary-500">Choose field type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FIELD_TYPES.map((ft) => (
                  <button
                    key={ft.type}
                    onClick={() => addField(ft.type)}
                    className="rounded-lg border border-primary-100 px-3 py-2 text-left transition-colors hover:border-brand/30 hover:bg-brand/5"
                  >
                    <p className="text-xs font-semibold text-primary-700">{ft.label}</p>
                    <p className="text-[10px] text-primary-400">{ft.description}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowFieldPicker(false)} className="mt-2 text-xs text-primary-400 hover:text-primary-600">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowFieldPicker(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary-200 bg-surface py-2.5 text-xs font-medium text-primary-400 transition-colors hover:border-brand/30 hover:text-brand"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add field
            </button>
          )}
        </div>
      )}
    </div>
  )
}
