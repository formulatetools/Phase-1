'use client'

import type { TimeField as TimeFieldType } from '@/types/worksheet'

interface Props {
  field: TimeFieldType
  value: string
  onChange: (value: string) => void
}

export function TimeField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <input
        id={field.id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}
