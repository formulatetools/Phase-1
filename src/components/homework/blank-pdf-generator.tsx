'use client'

import { useImperativeHandle, forwardRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import type { PdfBrandingOptions } from '@/lib/utils/fillable-pdf'

export interface BlankPdfGeneratorHandle {
  generatePdf: () => Promise<void>
}

interface BlankPdfGeneratorProps {
  schema: WorksheetSchema
  worksheetTitle: string
  branding?: PdfBrandingOptions
}

export const BlankPdfGenerator = forwardRef<BlankPdfGeneratorHandle, BlankPdfGeneratorProps>(
  function BlankPdfGenerator({ schema, worksheetTitle, branding }, ref) {
    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        const { downloadFillablePdf } = await import('@/lib/utils/fillable-pdf')
        await downloadFillablePdf({
          schema,
          title: worksheetTitle,
          ...(branding ? { branding } : { showBranding: true }),
        })
      },
    }))

    // No hidden DOM needed — PDF is generated directly from the schema
    return null
  }
)
