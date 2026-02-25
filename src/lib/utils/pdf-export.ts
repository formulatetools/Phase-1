/**
 * Shared PDF generation logic — Branded Formulate PDFs.
 * Used by WorksheetExport (therapist side) and BlankPdfGenerator (client side).
 * NHS hole-punch compliant: 20mm left margin, 15mm right.
 * Features: Formulate logo, amber accent bar, professional header/footer, 3x DPI.
 */

// Formulate logo SVG (matches LogoIcon in src/components/ui/logo.tsx)
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <g transform="rotate(0, 22, 22)">
    <path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" fill="none" stroke="#e4a930" stroke-width="3" stroke-linecap="round"/>
    <path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" fill="none" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="rotate(120, 22, 22)">
    <path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" fill="none" stroke="#e4a930" stroke-width="3" stroke-linecap="round"/>
    <path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" fill="none" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="rotate(240, 22, 22)">
    <path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" fill="none" stroke="#e4a930" stroke-width="3" stroke-linecap="round"/>
    <path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" fill="none" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`

/** Render the Formulate logo SVG to a base64 PNG for PDF embedding */
function getLogoDataUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([LOGO_SVG], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 132 // 3x for crisp rendering at small sizes
      canvas.height = 132
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas context failed'))
        return
      }
      ctx.drawImage(img, 0, 0, 132, 132)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Logo failed to load'))
    }
    img.src = url
  })
}

export async function generateWorksheetPdf(options: {
  targetSelector: string
  worksheetTitle: string
  showBranding?: boolean
}): Promise<void> {
  const { targetSelector, worksheetTitle, showBranding = true } = options

  const html2canvas = (await import('html2canvas-pro')).default
  const { jsPDF } = await import('jspdf')

  const target = document.querySelector(targetSelector) as HTMLElement
  if (!target) {
    window.print()
    return
  }

  // Load logo (non-blocking — continue without if it fails)
  let logoDataUrl: string | null = null
  try {
    logoDataUrl = await getLogoDataUrl()
  } catch {
    // Continue without logo
  }

  // ── A4 dimensions (mm) ──
  const A4_W = 210
  const A4_H = 297

  // ── NHS hole-punch margins ──
  const ML = 20 // left
  const MR = 15 // right

  // ── Branded header layout (mm from top) ──
  const ACCENT_H = 2    // amber bar height
  const LOGO_Y = 5      // logo top
  const LOGO_SIZE = 5   // logo width & height
  const TITLE_Y = 12    // worksheet title baseline
  const SEP_Y = 15      // header separator line
  const CONTENT_Y = 17  // content start

  // ── Footer layout ──
  const FOOTER_SEP_Y = A4_H - 10
  const FOOTER_TEXT_Y = A4_H - 7
  const CONTENT_END_Y = A4_H - 12

  const contentWidth = A4_W - ML - MR
  const contentHeight = CONTENT_END_Y - CONTENT_Y

  // ── Capture at 3x resolution for crisp print output ──
  const SCALE = 3

  const canvas = await html2canvas(target, {
    scale: SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (doc: Document) => {
      const el = doc.querySelector(targetSelector) as HTMLElement
      if (el) {
        el.style.boxShadow = 'none'
        el.style.border = 'none'
        el.style.borderRadius = '0'
        el.style.padding = '0'
      }
      // Hide buttons and interactive elements
      doc.querySelectorAll('button, .no-print, [data-no-print]').forEach((btn) => {
        ;(btn as HTMLElement).style.display = 'none'
      })
    },
  })

  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = contentWidth / (imgWidth / SCALE)
  const scaledHeight = (imgHeight / SCALE) * ratio

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const totalPages = Math.ceil(scaledHeight / contentHeight)

  const addHeader = (pageNum: number) => {
    // Amber accent bar — full bleed across page
    pdf.setFillColor(228, 169, 48) // #e4a930
    pdf.rect(0, 0, A4_W, ACCENT_H, 'F')

    // Logo image
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', ML, LOGO_Y, LOGO_SIZE, LOGO_SIZE)
    }

    // "Formulate" next to logo
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30, 41, 59) // slate-900
    pdf.text('Formulate', ML + LOGO_SIZE + 2, LOGO_Y + 3.5)

    // Page indicator
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(148, 163, 184) // slate-400
    pdf.text(`Page ${pageNum} of ${totalPages}`, A4_W - MR, LOGO_Y + 3.5, {
      align: 'right',
    })

    // Worksheet title
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30, 41, 59)
    pdf.text(worksheetTitle, ML, TITLE_Y)

    // Separator line
    pdf.setDrawColor(226, 232, 240) // slate-200
    pdf.setLineWidth(0.3)
    pdf.line(ML, SEP_Y, A4_W - MR, SEP_Y)
  }

  const addFooter = () => {
    if (!showBranding) return

    // Separator line
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.2)
    pdf.line(ML, FOOTER_SEP_Y, A4_W - MR, FOOTER_SEP_Y)

    // Footer text in brand amber
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(228, 169, 48)
    pdf.text(
      `Generated by Formulate  \u00b7  formulatetools.co.uk  \u00b7  ${new Date().toLocaleDateString('en-GB')}`,
      A4_W / 2,
      FOOTER_TEXT_Y,
      { align: 'center' }
    )
  }

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage()

    addHeader(page + 1)
    addFooter()

    // Slice the captured canvas for this page
    const sourceY = (page * contentHeight / ratio) * SCALE
    const sourceHeight = Math.min(
      (contentHeight / ratio) * SCALE,
      imgHeight - sourceY
    )

    if (sourceHeight <= 0) break

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = imgWidth
    pageCanvas.height = sourceHeight
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) break

    ctx.drawImage(
      canvas,
      0, sourceY, imgWidth, sourceHeight,
      0, 0, imgWidth, sourceHeight
    )

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95)
    const pageHeight = (sourceHeight / SCALE) * ratio

    pdf.addImage(
      pageImgData,
      'JPEG',
      ML,
      CONTENT_Y,
      contentWidth,
      pageHeight
    )
  }

  // Save with sanitised filename
  const safeName = worksheetTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  pdf.save(`${safeName}.pdf`)
}
