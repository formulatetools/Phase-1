'use client'

import type { SelectField as SelectFieldType } from '@/types/worksheet'

interface Props {
  field: SelectFieldType
  value: string
  onChange: (value: string) => void
  showError?: boolean
}

export function SelectField({ field, value, onChange, showError }: Props) {
  const errorId = `${field.id}-error`
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <select
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? errorId : undefined}
        className={`mt-1 block w-full rounded-lg border px-3 py-2 text-base md:text-sm text-primary-900 focus:outline-none focus:ring-1 ${
          showError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-primary-200 focus:border-brand focus:ring-brand/30'
        }`}
      >
        <option value="">{field.placeholder || 'Select...'}</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {showError && (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          Please select an option
        </p>
      )}
    </div>
  )
}
