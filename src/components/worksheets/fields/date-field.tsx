'use client'

import type { DateField as DateFieldType } from '@/types/worksheet'

interface Props {
  field: DateFieldType
  value: string
  onChange: (value: string) => void
}

export function DateField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={field.id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}
