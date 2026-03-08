'use client'

import { useState, useCallback, useRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'

export type StreamingStatus = 'idle' | 'streaming' | 'complete' | 'error'

export interface StreamingGenerateResult {
  title: string
  description: string
  instructions: string
  estimatedMinutes: number | null
  tags: string[]
  schema: WorksheetSchema
  confidence?: string
  interpretation?: string
  remaining?: number | null
}

interface UseStreamingGenerateReturn {
  status: StreamingStatus
  tokensReceived: number
  estimatedTotal: number
  /** Percentage 0-100 based on tokens received vs estimated total */
  progress: number
  statusMessage: string
  result: StreamingGenerateResult | null
  error: string | null
  generate: (
    description: string,
    clientContext?: {
      presentation?: string
      stage?: string
      previousWorksheets?: string[]
    }
  ) => Promise<void>
  reset: () => void
}

/**
 * Client-side hook for streaming AI worksheet generation.
 *
 * Connects to the SSE streaming endpoint, tracks real token progress,
 * and returns the complete result when finished.
 */
export function useStreamingGenerate(): UseStreamingGenerateReturn {
  const [status, setStatus] = useState<StreamingStatus>('idle')
  const [tokensReceived, setTokensReceived] = useState(0)
  const [estimatedTotal, setEstimatedTotal] = useState(2000)
  const [statusMessage, setStatusMessage] = useState('')
  const [result, setResult] = useState<StreamingGenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setStatus('idle')
    setTokensReceived(0)
    setEstimatedTotal(2000)
    setStatusMessage('')
    setResult(null)
    setError(null)
  }, [])

  const generate = useCallback(
    async (
      description: string,
      clientContext?: {
        presentation?: string
        stage?: string
        previousWorksheets?: string[]
      }
    ) => {
      // Reset state
      setStatus('streaming')
      setTokensReceived(0)
      setEstimatedTotal(2000)
      setStatusMessage('Starting generation...')
      setResult(null)
      setError(null)

      // Abort any previous in-flight request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const abortController = new AbortController()
      abortRef.current = abortController

      try {
        const response = await fetch('/api/generate-worksheet/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, clientContext }),
          signal: abortController.signal,
        })

        // Non-streaming error (auth, rate limit, etc.)
        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to generate worksheet.')
          setStatus('error')
          return
        }

        if (!response.body) {
          setError('Streaming not supported by your browser.')
          setStatus('error')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events from the buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue

            try {
              const event = JSON.parse(jsonStr) as {
                type: 'status' | 'progress' | 'complete' | 'error'
                message?: string
                tokens?: number
                estimated_total?: number
                data?: StreamingGenerateResult
              }

              switch (event.type) {
                case 'status':
                  setStatusMessage(event.message || '')
                  break

                case 'progress':
                  if (event.tokens !== undefined) setTokensReceived(event.tokens)
                  if (event.estimated_total !== undefined) setEstimatedTotal(event.estimated_total)
                  break

                case 'complete':
                  if (event.data) {
                    setResult(event.data)
                    setStatus('complete')
                    setStatusMessage('')
                  }
                  break

                case 'error':
                  setError(event.message || 'Generation failed.')
                  setStatus('error')
                  break
              }
            } catch {
              // Ignore malformed SSE events
            }
          }
        }

        // If we finished reading without a complete event, check status
        // (status might already be set to 'complete' or 'error' from events)
        setStatus((prev) => (prev === 'streaming' ? 'error' : prev))
        if (status === 'streaming') {
          setError('Stream ended unexpectedly. Please try again.')
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // User cancelled — don't update state
          return
        }
        setError('Network error. Check your connection and try again.')
        setStatus('error')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const progress = Math.min(100, Math.round((tokensReceived / estimatedTotal) * 100))

  return {
    status,
    tokensReceived,
    estimatedTotal,
    progress,
    statusMessage,
    result,
    error,
    generate,
    reset,
  }
}
