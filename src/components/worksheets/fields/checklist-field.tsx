'use client'

import type { ChecklistField as ChecklistFieldType } from '@/types/worksheet'

interface Props {
  field: ChecklistFieldType
  value: string[]
  onChange: (value: string[]) => void
}

export function ChecklistField({ field, value, onChange }: Props) {
  const toggle = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((v) => v !== optionId))
    } else {
      onChange([...value, optionId])
    }
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </legend>
      <div className="mt-2 space-y-2">
        {field.options.map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-2 text-sm text-primary-700"
          >
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              onChange={() => toggle(option.id)}
              className="h-4 w-4 rounded border-primary-300 text-brand focus:ring-brand/30"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
