'use client'

import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { WorksheetSchema } from '@/types/worksheet'

interface ImportResult {
  title: string
  description: string
  instructions: string
  estimatedMinutes: number | null
  tags: string[]
  schema: WorksheetSchema
  responseValues?: Record<string, unknown>
}

interface WorksheetImportPanelProps {
  onImportComplete: (data: ImportResult) => void
  disabled?: boolean
  clients?: { id: string; client_label: string }[]
  selectedClientId: string | null
  onClientChange: (id: string | null) => void
}

type ImportState = 'idle' | 'analysing' | 'success'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ACCEPTED_EXTENSIONS = '.pdf,.docx'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function WorksheetImportPanel({
  onImportComplete,
  disabled,
  clients,
  selectedClientId,
  onClientChange,
}: WorksheetImportPanelProps) {
  const { toast } = useToast()
  const [state, setState] = useState<ImportState>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [filled, setFilled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    // Client-side validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ type: 'error', message: 'Only PDF and Word (.docx) documents are supported.' })
      return
    }
    if (file.size > MAX_SIZE) {
      toast({ type: 'error', message: 'File must be under 5MB.' })
      return
    }

    setState('analysing')
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (filled) {
        formData.append('filled', 'true')
      }

      const response = await fetch('/api/import-worksheet', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        toast({ type: 'error', message: data.error || 'Failed to import worksheet.' })
        setState('idle')
        return
      }

      setState('success')
      const hasResponses = filled && data.responseValues && Object.keys(data.responseValues).length > 0
      toast({
        type: 'success',
        message: hasResponses
          ? 'Worksheet and responses imported — review and edit below.'
          : 'Worksheet imported — review and edit below.',
      })
      onImportComplete(data)
    } catch {
      toast({ type: 'error', message: 'Network error. Check your connection and try again.' })
      setState('idle')
    }
  }, [onImportComplete, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }, [processFile])

  const handleImportAgain = useCallback(() => {
    setState('idle')
    setFileName(null)
  }, [])

  if (state === 'success') {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5 dark:border-green-800/40 dark:bg-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Imported from <strong>{fileName}</strong></span>
          </div>
          <button
            type="button"
            onClick={handleImportAgain}
            className="text-xs font-medium text-green-600 transition-colors hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            Import again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? 'border-brand bg-brand/5 dark:bg-brand/10'
            : 'border-primary-200 bg-surface dark:border-primary-700'
        } ${disabled || state === 'analysing' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => state === 'idle' && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
      >
        {state === 'analysing' ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <svg className="h-6 w-6 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Analysing <strong>{fileName}</strong>...
              </p>
              <p className="mt-1 text-xs text-primary-500">This usually takes 5–10 seconds</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Drop a PDF or Word document here, or click to browse
              </p>
              <p className="mt-1 text-xs text-primary-500">.pdf, .docx — max 5MB</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload worksheet file"
        />
      </div>
      {/* Filled worksheet toggle */}
      <div className="mt-3 flex items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={filled}
          onClick={() => {
            setFilled((f) => {
              if (f) onClientChange(null) // Clear client when disabling filled mode
              return !f
            })
          }}
          disabled={state === 'analysing'}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${
            filled ? 'bg-brand' : 'bg-primary-200 dark:bg-primary-600'
          }`}
        >
          <span
            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              filled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
        <span className="text-xs text-primary-600 dark:text-primary-400">
          This worksheet has been filled in by a client
        </span>
      </div>
      <p className="mt-2 text-xs text-primary-500 dark:text-primary-400">
        {filled
          ? 'We\u2019ll extract both the worksheet structure and the client\u2019s responses. You can review and edit everything before saving.'
          : 'We\u2019ll analyse the structure and convert it into an editable worksheet. You can review and edit everything before saving.'}
      </p>
      {/* Client dropdown — shown when filled toggle is on */}
      {filled && clients && clients.length > 0 && (
        <div className="mt-3">
          <label className="text-xs font-semibold text-primary-500">
            Save responses to client (optional)
          </label>
          <select
            value={selectedClientId || ''}
            onChange={(e) => onClientChange(e.target.value || null)}
            disabled={state === 'analysing'}
            className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">Don&apos;t save to a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-primary-400">
            If selected, the imported responses will be saved as a completed entry for this client.
          </p>
        </div>
      )}
    </div>
  )
}
