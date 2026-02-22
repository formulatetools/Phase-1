'use client'

import type { LikertField as LikertFieldType } from '@/types/worksheet'

interface Props {
  field: LikertFieldType
  value: number
  onChange: (value: number) => void
}

export function LikertField({ field, value, onChange }: Props) {
  const step = field.step || 1
  const anchors = field.anchors || {}

  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="mt-2">
        <input
          id={field.id}
          type="range"
          min={field.min}
          max={field.max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent-600"
        />
        <div className="mt-1 flex justify-between text-xs text-primary-500">
          {Object.entries(anchors).map(([val, label]) => (
            <span key={val} className="text-center">
              {label}
            </span>
          ))}
        </div>
        <div className="mt-1 text-center text-sm font-medium text-primary-700">
          {value}
        </div>
      </div>
    </div>
  )
}
