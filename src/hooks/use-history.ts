'use client'

import { useState, useCallback, useRef } from 'react'

interface UseHistoryReturn<T> {
  value: T
  set: (newValue: T | ((prev: T) => T)) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Reset history, keeping current value (or provided value) as the new initial state */
  reset: (value?: T) => void
}

/**
 * Generic undo/redo state hook.
 *
 * - `set()` pushes the current value onto the past stack and clears the future stack.
 * - `undo()` pops from the past stack; `redo()` pops from the future stack.
 * - Stacks are stored in refs to avoid re-renders on every push.
 * - A `forceRender` counter updates `canUndo`/`canRedo` booleans.
 */
export function useHistory<T>(initial: T, maxDepth = 50): UseHistoryReturn<T> {
  const [present, setPresent] = useState<T>(initial)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])
  const [, forceRender] = useState(0)

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    setPresent((currentPresent) => {
      const resolved = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(currentPresent)
        : newValue

      pastRef.current = [...pastRef.current, currentPresent].slice(-maxDepth)
      futureRef.current = []
      forceRender((n) => n + 1)

      return resolved
    })
  }, [maxDepth])

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    setPresent((currentPresent) => {
      const previous = pastRef.current[pastRef.current.length - 1]
      pastRef.current = pastRef.current.slice(0, -1)
      futureRef.current = [currentPresent, ...futureRef.current]
      forceRender((n) => n + 1)
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    setPresent((currentPresent) => {
      const next = futureRef.current[0]
      futureRef.current = futureRef.current.slice(1)
      pastRef.current = [...pastRef.current, currentPresent]
      forceRender((n) => n + 1)
      return next
    })
  }, [])

  const reset = useCallback((value?: T) => {
    if (value !== undefined) setPresent(value)
    pastRef.current = []
    futureRef.current = []
    forceRender((n) => n + 1)
  }, [])

  return {
    value: present,
    set,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  }
}
