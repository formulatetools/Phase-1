'use client'

import { useImperativeHandle, forwardRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { downloadFillablePdf } from '@/lib/utils/fillable-pdf'

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
    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        await downloadFillablePdf({
          schema,
          title: worksheetTitle,
          showBranding: true,
          values: responseData,
        })
      },
    }))

    // No hidden DOM needed — PDF is generated directly from the schema
    return null
  }
)
