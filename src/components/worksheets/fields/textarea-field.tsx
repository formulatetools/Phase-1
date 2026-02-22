'use client'

import type { TextareaField as TextareaFieldType } from '@/types/worksheet'

interface Props {
  field: TextareaFieldType
  value: string
  onChange: (value: string) => void
}

export function TextareaField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <textarea
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        rows={4}
        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
      />
    </div>
  )
}
