'use client'

import type { TextareaField as TextareaFieldType } from '@/types/worksheet'
import { AutoTextarea } from '@/components/ui/auto-textarea'

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
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <AutoTextarea
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        minRows={3}
        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}
