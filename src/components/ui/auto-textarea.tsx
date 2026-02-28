'use client'

import { useRef, useEffect, useCallback } from 'react'

interface AutoTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Minimum number of visible rows. Defaults to 2. */
  minRows?: number
}

/**
 * Auto-growing textarea — expands vertically as the user types.
 * Starts at `minRows` height and grows to fit content.
 */
export function AutoTextarea({
  minRows = 2,
  value,
  className,
  style,
  onInput,
  ...props
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    // Reset to auto so scrollHeight recalculates correctly
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  // Resize when value changes (e.g. initial load, programmatic updates)
  useEffect(() => {
    resize()
  }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      className={className}
      style={{ ...style, overflow: 'hidden', resize: 'none' }}
      onInput={(e) => {
        resize()
        onInput?.(e)
      }}
      {...props}
    />
  )
}
