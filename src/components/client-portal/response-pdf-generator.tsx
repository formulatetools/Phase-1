'use client'

import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
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

        // Wait for the DOM to render with response data
        await new Promise((resolve) => setTimeout(resolve, 500))

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
              <WorksheetRenderer
                schema={schema}
                readOnly={true}
                initialValues={responseData}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
)
