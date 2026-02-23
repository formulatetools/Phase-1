'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'formulate_tour_completed'

export function useTour() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  const start = useCallback(() => {
    setStep(0)
    setActive(true)
  }, [])

  const next = useCallback(() => {
    setStep((s) => s + 1)
  }, [])

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const complete = useCallback(() => {
    setActive(false)
    setStep(0)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
  }, [])

  const skip = complete

  const isCompleted = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  }

  return { active, step, start, next, prev, complete, skip, isCompleted }
}
