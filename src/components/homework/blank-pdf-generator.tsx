'use client'

import { useImperativeHandle, forwardRef } from 'react'
import type { WorksheetSchema } from '@/types/worksheet'
import { downloadFillablePdf } from '@/lib/utils/fillable-pdf'

export interface BlankPdfGeneratorHandle {
  generatePdf: () => Promise<void>
}

interface BlankPdfGeneratorProps {
  schema: WorksheetSchema
  worksheetTitle: string
}

export const BlankPdfGenerator = forwardRef<BlankPdfGeneratorHandle, BlankPdfGeneratorProps>(
  function BlankPdfGenerator({ schema, worksheetTitle }, ref) {
    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        await downloadFillablePdf({
          schema,
          title: worksheetTitle,
          showBranding: true,
        })
      },
    }))

    // No hidden DOM needed — PDF is generated directly from the schema
    return null
  }
)
