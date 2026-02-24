'use client'

import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { generateWorksheetPdf } from '@/lib/utils/pdf-export'

export interface BlankPdfGeneratorHandle {
  generatePdf: () => Promise<void>
}

interface BlankPdfGeneratorProps {
  schema: WorksheetSchema
  worksheetTitle: string
}

export const BlankPdfGenerator = forwardRef<BlankPdfGeneratorHandle, BlankPdfGeneratorProps>(
  function BlankPdfGenerator({ schema, worksheetTitle }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        // Mount the hidden renderer
        setMounted(true)

        // Wait for the DOM to render
        await new Promise((resolve) => setTimeout(resolve, 500))

        try {
          await generateWorksheetPdf({
            targetSelector: '[data-blank-worksheet-content]',
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
          width: '700px', // Fixed width for consistent PDF rendering
        }}
        aria-hidden="true"
      >
        <div data-blank-worksheet-content>
          <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {worksheetTitle}
            </h1>
            <div style={{ marginTop: '24px' }}>
              <WorksheetRenderer
                schema={schema}
                readOnly={false}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
)
