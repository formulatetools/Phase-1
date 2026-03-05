'use client'

import type { LikertField as LikertFieldType } from '@/types/worksheet'

interface Props {
  field: LikertFieldType
  value: number | null
  onChange: (value: number) => void
  showError?: boolean
}

export function LikertField({ field, value, onChange, showError }: Props) {
  const step = field.step || 1
  const anchors = field.anchors || {}
  const isUnset = value === null || value === undefined

  // Find the anchor label for the current value, if one exists
  const currentAnchorLabel = !isUnset ? anchors[String(value)] : undefined
  const hasError = showError && field.required && isUnset

  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-primary-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      <div className="mt-2">
        <input
          id={field.id}
          type="range"
          min={field.min}
          max={field.max}
          step={step}
          value={isUnset ? field.min : value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={isUnset ? 'Not set' : currentAnchorLabel ? `${value} — ${currentAnchorLabel}` : String(value)}
          aria-required={field.required || undefined}
          className={`w-full accent-brand${isUnset ? ' opacity-40' : ''}`}
        />
        <div className="mt-1 flex justify-between text-xs text-primary-500">
          {Object.entries(anchors).map(([val, label]) => (
            <span key={val} className="text-center">
              {label}
            </span>
          ))}
        </div>
        <div className="mt-1 text-center text-sm font-medium text-primary-700">
          {isUnset ? (
            <span className="text-primary-400 italic">Tap to set a value</span>
          ) : (
            value
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-xs text-red-600" role="alert">This field is required</p>
        )}
      </div>
    </div>
  )
}
