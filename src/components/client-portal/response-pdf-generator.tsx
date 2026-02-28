'use client'

import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { isMultiEntryResponse } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { generateWorksheetPdf } from '@/lib/utils/pdf-export'

export interface ResponsePdfGeneratorHandle {
  generatePdf: () => Promise<void>
}

interface ResponsePdfGeneratorProps {
  schema: WorksheetSchema
  worksheetTitle: string
  responseData: Record<string, unknown>
}

export const ResponsePdfGenerator = forwardRef<ResponsePdfGeneratorHandle, ResponsePdfGeneratorProps>(
  function ResponsePdfGenerator({ schema, worksheetTitle, responseData }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        setMounted(true)

        // Wait for fonts + layout to be fully ready
        if (document.fonts?.ready) await document.fonts.ready
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

        try {
          await generateWorksheetPdf({
            targetSelector: '[data-response-worksheet-content]',
            worksheetTitle,
            showBranding: true,
          })
        } finally {
          setMounted(false)
        }
      },
    }))

    if (!mounted) return null

    return (
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '700px',
        }}
        aria-hidden="true"
      >
        <div data-response-worksheet-content>
          <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {worksheetTitle}
            </h1>
            <div style={{ marginTop: '24px' }}>
              {isMultiEntryResponse(responseData) ? (
                // Multi-entry: render each entry with a label
                (responseData as { _entries: Record<string, unknown>[] })._entries.map((entry, i) => (
                  <div key={i} style={{ marginBottom: i < (responseData as { _entries: Record<string, unknown>[] })._entries.length - 1 ? '32px' : 0 }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#555', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      Entry {i + 1}
                    </h2>
                    <WorksheetRenderer
                      schema={schema}
                      readOnly
                      initialValues={entry}
                    />
                  </div>
                ))
              ) : (
                <WorksheetRenderer
                  schema={schema}
                  readOnly
                  initialValues={responseData}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
