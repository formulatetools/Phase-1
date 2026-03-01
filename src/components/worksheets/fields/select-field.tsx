'use client'

import type { SelectField as SelectFieldType } from '@/types/worksheet'

interface Props {
  field: SelectFieldType
  value: string
  onChange: (value: string) => void
}

export function SelectField({ field, value, onChange }: Props) {
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
        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
      >
        <option value="">{field.placeholder || 'Select...'}</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
