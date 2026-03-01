'use client'

import type { TextField as TextFieldType } from '@/types/worksheet'

interface Props {
  field: TextFieldType
  value: string
  onChange: (value: string) => void
}

export function TextField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <input
        id={field.id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-base md:text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}
