'use client'

import { useImperativeHandle, forwardRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { downloadFillablePdf } from '@/lib/utils/fillable-pdf'
import type { PdfBrandingOptions } from '@/lib/utils/fillable-pdf'

export interface ResponsePdfGeneratorHandle {
  generatePdf: () => Promise<void>
}

interface ResponsePdfGeneratorProps {
  schema: WorksheetSchema
  worksheetTitle: string
  responseData: Record<string, unknown>
  branding?: PdfBrandingOptions
}

export const ResponsePdfGenerator = forwardRef<ResponsePdfGeneratorHandle, ResponsePdfGeneratorProps>(
  function ResponsePdfGenerator({ schema, worksheetTitle, responseData, branding }, ref) {
    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        await downloadFillablePdf({
          schema,
          title: worksheetTitle,
          ...(branding ? { branding } : { showBranding: true }),
          values: responseData,
        })
      },
    }))

    // No hidden DOM needed — PDF is generated directly from the schema
    return null
  }
)
