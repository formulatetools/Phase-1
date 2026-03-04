'use client'

import type { TextareaField as TextareaFieldType } from '@/types/worksheet'
import { AutoTextarea } from '@/components/ui/auto-textarea'

interface Props {
  field: TextareaFieldType
  value: string
  onChange: (value: string) => void
  showError?: boolean
}

export function TextareaField({ field, value, onChange, showError }: Props) {
  const hasError = showError && field.required && !value.trim()
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
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${field.id}-error` : undefined}
        className={`mt-1 block w-full rounded-lg border px-3 py-2 text-base md:text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-1 ${
          hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-red-300/30'
            : 'border-primary-200 focus:border-brand focus:ring-brand/30'
        }`}
      />
      {hasError && (
        <p id={`${field.id}-error`} className="mt-1 text-xs text-red-500" role="alert">This field is required</p>
      )}
    </div>
  )
}
