/**
 * Shared PDF generation logic — Branded Formulate PDFs.
 * Used by WorksheetExport (therapist side) and BlankPdfGenerator (client side).
 * NHS hole-punch compliant: 20mm left margin, 15mm right.
 * Features: Formulate logo, amber accent bar, professional header/footer, 4x DPI.
 *
 * v2 — Section-level rendering with smart page breaks:
 *   - Each worksheet section is rendered individually at 4× as PNG
 *   - Sections are placed on pages without splitting mid-section when possible
 *   - Uses document.fonts.ready + double rAF for reliable font loading
 *   - PNG output (no JPEG artifacts on text)
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

/** Wait for fonts + layout to be fully ready */
async function waitForRender(): Promise<void> {
  // Wait for all fonts to load
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  // Double rAF — ensures browser has painted at least one frame
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
}

/** Prepare a cloned element for PDF rendering (strip shadows, hide buttons, etc.) */
function prepareClone(doc: Document, targetSelector: string) {
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

const CONTENT_WIDTH = A4_W - ML - MR
const CONTENT_HEIGHT = CONTENT_END_Y - CONTENT_Y

// ── Render scale ──
const SCALE = 4

// Gap between sections in mm
const SECTION_GAP = 3

/** Extra vertical offset when client/therapist metadata is present */
const META_OFFSET = 4

/** Shared header/footer rendering */
function addHeader(
  pdf: InstanceType<typeof import('jspdf').jsPDF>,
  pageNum: number,
  totalPages: number,
  worksheetTitle: string,
  logoDataUrl: string | null,
  meta?: { clientName?: string; therapistName?: string },
) {
  // Amber accent bar — full bleed
  pdf.setFillColor(228, 169, 48) // #e4a930
  pdf.rect(0, 0, A4_W, ACCENT_H, 'F')

  // Logo
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', ML, LOGO_Y, LOGO_SIZE, LOGO_SIZE)
  }

  // "Formulate" next to logo
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 41, 59)
  pdf.text('Formulate', ML + LOGO_SIZE + 2, LOGO_Y + 3.5)

  // Page indicator
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(148, 163, 184)
  pdf.text(`Page ${pageNum} of ${totalPages}`, A4_W - MR, LOGO_Y + 3.5, {
    align: 'right',
  })

  // Worksheet title
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 41, 59)
  pdf.text(worksheetTitle, ML, TITLE_Y)

  // Client / Therapist metadata line
  const hasMeta = meta?.clientName || meta?.therapistName
  if (hasMeta) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    if (meta?.clientName) {
      pdf.text(`Client: ${meta.clientName}`, ML, TITLE_Y + 3.5)
    }
    if (meta?.therapistName) {
      pdf.text(`Therapist: ${meta.therapistName}`, A4_W - MR, TITLE_Y + 3.5, {
        align: 'right',
      })
    }
  }

  // Separator line (shift down when metadata is present)
  const sepY = hasMeta ? SEP_Y + META_OFFSET : SEP_Y
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.3)
  pdf.line(ML, sepY, A4_W - MR, sepY)
}

function addFooter(
  pdf: InstanceType<typeof import('jspdf').jsPDF>,
  showBranding: boolean,
  completedDate?: string,
) {
  if (!showBranding) return

  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.2)
  pdf.line(ML, FOOTER_SEP_Y, A4_W - MR, FOOTER_SEP_Y)

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(228, 169, 48)

  const datePart = completedDate
    ? `Completed: ${completedDate}`
    : new Date().toLocaleDateString('en-GB')
  pdf.text(
    `Generated by Formulate  \u00b7  formulatetools.co.uk  \u00b7  ${datePart}`,
    A4_W / 2,
    FOOTER_TEXT_Y,
    { align: 'center' }
  )
}

/** A captured section image with its height in mm */
interface SectionImage {
  dataUrl: string
  widthMm: number
  heightMm: number
}

/**
 * Section-level PDF generation — renders each worksheet section individually at 4×
 * and places them on pages with smart breaks (avoids splitting sections).
 */
async function generateSectionBased(options: {
  target: HTMLElement
  targetSelector: string
  worksheetTitle: string
  showBranding: boolean
  logoDataUrl: string | null
  clientName?: string
  therapistName?: string
  completedDate?: string
}): Promise<void> {
  const { target, targetSelector, worksheetTitle, showBranding, logoDataUrl, clientName, therapistName, completedDate } = options
  const hasMeta = !!(clientName || therapistName)
  const contentY = hasMeta ? CONTENT_Y + META_OFFSET : CONTENT_Y
  const contentHeight = hasMeta ? CONTENT_HEIGHT - META_OFFSET : CONTENT_HEIGHT
  const meta = { clientName, therapistName }
  const html2canvas = (await import('html2canvas-pro')).default
  const { jsPDF } = await import('jspdf')

  // Find sections
  const sections = target.querySelectorAll<HTMLElement>('[data-worksheet-section]')

  // Also capture any content outside of sections (e.g. title header in the hidden container)
  // by looking for direct children that aren't sections
  const allElements: HTMLElement[] = []

  // Get all direct child divs of the target's inner content area
  const contentWrapper = target.firstElementChild as HTMLElement
  if (contentWrapper) {
    // The structure is: target > padding-div > WorksheetRenderer(space-y-8) > sections
    // We want to capture each top-level child of the space-y-8 div
    const rendererDiv = contentWrapper.querySelector('.space-y-8, .space-y-6') as HTMLElement
    if (rendererDiv && sections.length > 0) {
      // Use the individual sections from the renderer
      sections.forEach(s => allElements.push(s))
    } else {
      // No sections found — fall back to the whole target
      allElements.push(target)
    }
  } else {
    allElements.push(target)
  }

  // If we only have the whole target (no individual sections), fall back to legacy
  if (allElements.length === 1 && allElements[0] === target) {
    await generateLegacy({ target, targetSelector, worksheetTitle, showBranding, logoDataUrl })
    return
  }

  // Capture each section as a PNG at 4× resolution
  const sectionImages: SectionImage[] = []

  for (const section of allElements) {
    const canvas = await html2canvas(section, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (doc: Document) => {
        prepareClone(doc, targetSelector)
      },
    })

    const pixelWidth = canvas.width / SCALE
    const ratio = CONTENT_WIDTH / pixelWidth
    const heightMm = (canvas.height / SCALE) * ratio

    sectionImages.push({
      dataUrl: canvas.toDataURL('image/png'),
      widthMm: CONTENT_WIDTH,
      heightMm,
    })
  }

  // Layout: place sections on pages with smart breaks
  // First pass — determine page assignments
  interface PageSlot {
    sectionIndex: number
    y: number // Y position in mm from CONTENT_Y
  }
  const pages: PageSlot[][] = [[]]
  let currentPageY = 0

  for (let i = 0; i < sectionImages.length; i++) {
    const img = sectionImages[i]
    const neededHeight = img.heightMm + (currentPageY > 0 ? SECTION_GAP : 0)

    // Would this section fit on the current page?
    if (currentPageY + neededHeight <= contentHeight) {
      // Fits — add to current page
      const y = currentPageY + (currentPageY > 0 ? SECTION_GAP : 0)
      pages[pages.length - 1].push({ sectionIndex: i, y })
      currentPageY = y + img.heightMm
    } else if (img.heightMm <= contentHeight) {
      // Doesn't fit but would fit on a fresh page — start new page
      pages.push([])
      pages[pages.length - 1].push({ sectionIndex: i, y: 0 })
      currentPageY = img.heightMm
    } else {
      // Section is taller than one page — needs to be split across pages
      // Start on a new page if current page has content
      if (currentPageY > 0) {
        pages.push([])
        currentPageY = 0
      }
      pages[pages.length - 1].push({ sectionIndex: i, y: 0 })
      currentPageY = img.heightMm // Will be handled during rendering
    }
  }

  const totalPages = pages.reduce((count, pageSlots) => {
    // Check if any section on this page overflows
    for (const slot of pageSlots) {
      const img = sectionImages[slot.sectionIndex]
      if (slot.y + img.heightMm > contentHeight) {
        // This section overflows — calculate how many extra pages it needs
        const overflow = (slot.y + img.heightMm) - contentHeight
        return count + Math.ceil(overflow / contentHeight)
      }
    }
    return count
  }, pages.length)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let globalPageNum = 0

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const slots = pages[pageIdx]

    if (globalPageNum > 0) pdf.addPage()
    globalPageNum++
    addHeader(pdf, globalPageNum, totalPages, worksheetTitle, logoDataUrl, meta)
    addFooter(pdf, showBranding, completedDate)

    for (const slot of slots) {
      const img = sectionImages[slot.sectionIndex]

      if (slot.y + img.heightMm <= contentHeight) {
        // Section fits entirely on this page
        pdf.addImage(
          img.dataUrl,
          'PNG',
          ML,
          contentY + slot.y,
          img.widthMm,
          img.heightMm,
        )
      } else {
        // Section overflows — split it across pages
        // We need to use canvas slicing for this
        const tempImg = new Image()
        await new Promise<void>((resolve) => {
          tempImg.onload = () => resolve()
          tempImg.src = img.dataUrl
        })

        const fullCanvas = document.createElement('canvas')
        fullCanvas.width = tempImg.width
        fullCanvas.height = tempImg.height
        const fullCtx = fullCanvas.getContext('2d')
        if (!fullCtx) continue
        fullCtx.drawImage(tempImg, 0, 0)

        const pixelsPerMm = tempImg.height / img.heightMm
        let remainingMm = img.heightMm
        let sourceYPx = 0
        let firstSlice = true

        while (remainingMm > 0) {
          const availableMm = firstSlice
            ? contentHeight - slot.y
            : contentHeight
          const sliceMm = Math.min(remainingMm, availableMm)
          const sliceHeightPx = Math.round(sliceMm * pixelsPerMm)

          if (sliceHeightPx <= 0) break

          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = fullCanvas.width
          sliceCanvas.height = sliceHeightPx
          const sliceCtx = sliceCanvas.getContext('2d')
          if (!sliceCtx) break

          sliceCtx.drawImage(
            fullCanvas,
            0, sourceYPx, fullCanvas.width, sliceHeightPx,
            0, 0, fullCanvas.width, sliceHeightPx,
          )

          const yPos = firstSlice ? contentY + slot.y : contentY

          pdf.addImage(
            sliceCanvas.toDataURL('image/png'),
            'PNG',
            ML,
            yPos,
            img.widthMm,
            sliceMm,
          )

          sourceYPx += sliceHeightPx
          remainingMm -= sliceMm
          firstSlice = false

          if (remainingMm > 0) {
            pdf.addPage()
            globalPageNum++
            addHeader(pdf, globalPageNum, totalPages, worksheetTitle, logoDataUrl, meta)
            addFooter(pdf, showBranding, completedDate)
          }
        }
      }
    }
  }

  // Save
  const safeName = worksheetTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  pdf.save(`${safeName}.pdf`)
}

/**
 * Legacy fallback — captures the entire target as one canvas
 * Used for formulation layouts and other non-section-based schemas
 */
async function generateLegacy(options: {
  target: HTMLElement
  targetSelector: string
  worksheetTitle: string
  showBranding: boolean
  logoDataUrl: string | null
  clientName?: string
  therapistName?: string
  completedDate?: string
}): Promise<void> {
  const { target, targetSelector, worksheetTitle, showBranding, logoDataUrl, clientName, therapistName, completedDate } = options
  const hasMeta = !!(clientName || therapistName)
  const contentYLocal = hasMeta ? CONTENT_Y + META_OFFSET : CONTENT_Y
  const contentHeightLocal = hasMeta ? CONTENT_HEIGHT - META_OFFSET : CONTENT_HEIGHT
  const meta = { clientName, therapistName }

  const html2canvas = (await import('html2canvas-pro')).default
  const { jsPDF } = await import('jspdf')

  const canvas = await html2canvas(target, {
    scale: SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (doc: Document) => {
      prepareClone(doc, targetSelector)
    },
  })

  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = CONTENT_WIDTH / (imgWidth / SCALE)
  const scaledHeight = (imgHeight / SCALE) * ratio

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const totalPages = Math.ceil(scaledHeight / contentHeightLocal)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage()

    addHeader(pdf, page + 1, totalPages, worksheetTitle, logoDataUrl, meta)
    addFooter(pdf, showBranding, completedDate)

    const sourceY = (page * contentHeightLocal / ratio) * SCALE
    const sourceHeight = Math.min(
      (contentHeightLocal / ratio) * SCALE,
      imgHeight - sourceY,
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
      0, 0, imgWidth, sourceHeight,
    )

    const pageImgData = pageCanvas.toDataURL('image/png')
    const pageHeight = (sourceHeight / SCALE) * ratio

    pdf.addImage(pageImgData, 'PNG', ML, contentYLocal, CONTENT_WIDTH, pageHeight)
  }

  const safeName = worksheetTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  pdf.save(`${safeName}.pdf`)
}

export async function generateWorksheetPdf(options: {
  targetSelector: string
  worksheetTitle: string
  showBranding?: boolean
  clientName?: string
  therapistName?: string
  completedDate?: string
}): Promise<void> {
  const { targetSelector, worksheetTitle, showBranding = true, clientName, therapistName, completedDate } = options

  const target = document.querySelector(targetSelector) as HTMLElement
  if (!target) {
    window.print()
    return
  }

  // Wait for fonts + layout
  await waitForRender()

  // Load logo (non-blocking — continue without if it fails)
  let logoDataUrl: string | null = null
  try {
    logoDataUrl = await getLogoDataUrl()
  } catch {
    // Continue without logo
  }

  // Try section-based rendering first, falls back to legacy
  await generateSectionBased({
    target,
    targetSelector,
    worksheetTitle,
    showBranding,
    logoDataUrl,
    clientName,
    therapistName,
    completedDate,
  })
}
