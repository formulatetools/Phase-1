'use client'

import type { NumberField as NumberFieldType } from '@/types/worksheet'

interface Props {
  field: NumberFieldType
  value: number | ''
  onChange: (value: number | '') => void
  showError?: boolean
}

export function NumberField({ field, value, onChange, showError }: Props) {
  const errorId = `${field.id}-error`
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <input
        id={field.id}
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
        placeholder={field.placeholder}
        required={field.required}
        min={field.min}
        max={field.max}
        step={field.step}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? errorId : undefined}
        className={`mt-1 block w-full rounded-lg border px-3 py-2 text-base md:text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-1 ${
          showError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-primary-200 focus:border-brand focus:ring-brand/30'
        }`}
      />
      {showError && (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          This field is required
        </p>
      )}
    </div>
  )
}
