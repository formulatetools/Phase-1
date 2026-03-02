/**
 * Fillable PDF generator — schema-driven, branded Formulate PDFs with AcroForm fields.
 *
 * Replaces the old html2canvas → jsPDF screenshot approach with pure pdf-lib generation.
 * Walks the worksheet schema (sections → fields), draws branded layout with vector text,
 * and creates interactive AcroForm fields (text inputs, checkboxes, dropdowns).
 *
 * NHS hole-punch compliant: 20 mm left margin, 15 mm right.
 * A4 format, Helvetica font family, amber (#e4a930) accent branding.
 */

import {
  PDFDocument,
  PDFPage,
  PDFForm,
  PDFFont,
  StandardFonts,
  rgb,
  PDFTextField,
} from 'pdf-lib'
import type {
  WorksheetSchema,
  WorksheetSection,
  WorksheetField,
  TextField,
  TextareaField,
  NumberField,
  LikertField,
  ChecklistField,
  DateField,
  TimeField,
  SelectField,
  TableField,
  HierarchyField,
  SafetyPlanField,
  DecisionTreeField,
  FormulationField,
  RecordField,
  ComputedField,
} from '@/types/worksheet'
import { isMultiEntryResponse } from '@/types/worksheet'

// ─── A4 dimensions in points (1 mm = 2.83465 pt) ───────────────────────────

const MM = 2.83465 // 1 mm in points

const PAGE_W = 210 * MM  // 595.28 pt
const PAGE_H = 297 * MM  // 841.89 pt

// NHS hole-punch compliant margins
const ML = 20 * MM       // 56.7 pt — left margin
const MR = 15 * MM       // 42.5 pt — right margin
const CONTENT_W = PAGE_W - ML - MR  // 496.1 pt

// Header layout
// Logo sits in the left margin (centred at ~10mm from left edge).
// "Formulate" wordmark starts at the content margin line (ML).
// Extra breathing room between brand row and title.
const ACCENT_H = 2 * MM        // amber bar height
const LOGO_SIZE = 8 * MM       // prominent brand mark filling ~40% of margin width
const LOGO_X = 10 * MM - LOGO_SIZE / 2  // centred in the 20mm left margin
const BRAND_Y = 297 * MM - 10 * MM      // brand row baseline — nudged down to centre the larger logo
const TITLE_Y = 297 * MM - 15 * MM      // title baseline — pushed down for breathing room
const SEP_Y = 297 * MM - 17.5 * MM      // separator line
const CONTENT_TOP = 297 * MM - 20 * MM  // content start — 2.5mm below separator

// Footer layout
const FOOTER_MB = 7 * MM
const FOOTER_SEP_Y = 10 * MM
const FOOTER_TEXT_Y = FOOTER_MB
const CONTENT_BOTTOM = 12 * MM  // content must stay above this

// ─── Element sizing (points) ────────────────────────────────────────────────

const SECTION_TITLE_SIZE = 13
const SECTION_TITLE_HEIGHT = 24
const SECTION_DESC_SIZE = 9
const SECTION_DESC_LINE_H = 14
const FIELD_LABEL_SIZE = 10
const FIELD_LABEL_HEIGHT = 18
const TEXT_FIELD_H = 22
const TEXTAREA_H = 72
const CHECKBOX_ROW_H = 16
const DROPDOWN_H = 22
const TABLE_HEADER_H = 18
const TABLE_ROW_H = 22
const DIARY_TABLE_ROW_H = 40   // Taller rows for diary/repeatable worksheets (more writing room)
const SECTION_GAP = 20
const FIELD_GAP = 10
const INSTRUCTIONS_SIZE = 9
const INSTRUCTIONS_LINE_H = 13

// ─── Colours ────────────────────────────────────────────────────────────────

const AMBER = rgb(228 / 255, 169 / 255, 48 / 255)
const AMBER_LIGHT = rgb(253 / 255, 246 / 255, 227 / 255)    // #fdf6e3
const AMBER_BORDER = rgb(228 / 255, 169 / 255, 48 / 255)     // 20% opacity approximation on white
const DARK = rgb(30 / 255, 41 / 255, 59 / 255)
const RED = rgb(220 / 255, 38 / 255, 38 / 255)               // #dc2626 — safety plan step 6
const GREY_TEXT = rgb(148 / 255, 163 / 255, 184 / 255)
const GREY_LINE = rgb(226 / 255, 232 / 255, 240 / 255)
const LIGHT_BG = rgb(248 / 255, 250 / 255, 252 / 255)
const FIELD_BORDER = rgb(203 / 255, 213 / 255, 225 / 255)
const WHITE = rgb(1, 1, 1)

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FillablePdfOptions {
  schema: WorksheetSchema
  title: string
  description?: string
  instructions?: string
  showBranding?: boolean
  values?: Record<string, unknown>
}

// ─── Layout cursor (tracks position, handles page breaks) ───────────────────

class LayoutCursor {
  y: number = CONTENT_TOP
  pageIndex: number = 0
  pages: PDFPage[]
  pdfDoc: PDFDocument
  fonts: { regular: PDFFont; bold: PDFFont; oblique: PDFFont }
  showBranding: boolean
  title: string
  totalPages: number = 1 // Updated after first pass

  constructor(
    pdfDoc: PDFDocument,
    pages: PDFPage[],
    fonts: { regular: PDFFont; bold: PDFFont; oblique: PDFFont },
    showBranding: boolean,
    title: string,
  ) {
    this.pdfDoc = pdfDoc
    this.pages = pages
    this.fonts = fonts
    this.showBranding = showBranding
    this.title = title
  }

  get page(): PDFPage {
    return this.pages[this.pageIndex]
  }

  ensureSpace(needed: number): void {
    if (this.y - needed < CONTENT_BOTTOM) {
      this.newPage()
    }
  }

  advance(height: number): void {
    this.y -= height
  }

  newPage(): void {
    const page = this.pdfDoc.addPage([PAGE_W, PAGE_H])
    this.pages.push(page)
    this.pageIndex = this.pages.length - 1
    this.y = CONTENT_TOP
    this.totalPages++
  }
}

// ─── Drawing helpers ────────────────────────────────────────────────────────

function drawHeader(
  page: PDFPage,
  pageNum: number,
  totalPages: number,
  title: string,
  fonts: { regular: PDFFont; bold: PDFFont },
) {
  // Amber accent bar — full bleed at top
  page.drawRectangle({
    x: 0,
    y: PAGE_H - ACCENT_H,
    width: PAGE_W,
    height: ACCENT_H,
    color: AMBER,
  })

  // Draw Formulate logo — in the left margin, centred horizontally
  drawLogo(page, LOGO_X, BRAND_Y)

  // "Formulate" wordmark — starts at the content margin line, vertically centred with logo
  const logoMidY = BRAND_Y + LOGO_SIZE / 2
  page.drawText('Formulate', {
    x: ML,
    y: logoMidY - 3.5, // baseline offset for 10pt text
    size: 10,
    font: fonts.bold,
    color: DARK,
  })

  // Page number — right-aligned, same baseline as "Formulate"
  const pageText = `Page ${pageNum} of ${totalPages}`
  const pageTextWidth = fonts.regular.widthOfTextAtSize(pageText, 7)
  page.drawText(pageText, {
    x: PAGE_W - MR - pageTextWidth,
    y: logoMidY - 2.5,
    size: 7,
    font: fonts.regular,
    color: GREY_TEXT,
  })

  // Worksheet title — with breathing room below the brand row
  page.drawText(truncateText(title, fonts.bold, 12, CONTENT_W), {
    x: ML,
    y: TITLE_Y,
    size: 12,
    font: fonts.bold,
    color: DARK,
  })

  // Separator line
  page.drawLine({
    start: { x: ML, y: SEP_Y },
    end: { x: PAGE_W - MR, y: SEP_Y },
    thickness: 0.3,
    color: GREY_LINE,
  })
}

function drawFooter(
  page: PDFPage,
  showBranding: boolean,
  fonts: { regular: PDFFont },
) {
  if (!showBranding) return

  // Separator line
  page.drawLine({
    start: { x: ML, y: FOOTER_SEP_Y },
    end: { x: PAGE_W - MR, y: FOOTER_SEP_Y },
    thickness: 0.2,
    color: GREY_LINE,
  })

  const dateStr = new Date().toLocaleDateString('en-GB')
  const footerText = `Powered by Formulate  ·  formulatetools.co.uk  ·  ${dateStr}`
  const textWidth = fonts.regular.widthOfTextAtSize(footerText, 7)

  // Draw small logo icon before footer text
  const logoFooterSize = 3 * MM
  const totalWidth = logoFooterSize + 3 + textWidth // logo + gap + text
  const startX = (PAGE_W - totalWidth) / 2

  drawLogo(page, startX, FOOTER_TEXT_Y - logoFooterSize * 0.3, logoFooterSize)

  page.drawText(footerText, {
    x: startX + logoFooterSize + 3,
    y: FOOTER_TEXT_Y,
    size: 7,
    font: fonts.regular,
    color: AMBER,
  })
}

/** Draw the Formulate logo — three amber curved arrows in a triangle.
 *  Renders as three arcs with chevron arrowheads, closely matching the LogoIcon SVG.
 *  The SVG has viewBox 0 0 44 44 with arcs at radius 14 from centre (22,22).
 *  We scale proportionally to the requested `size`. */
function drawLogo(page: PDFPage, x: number, y: number, size?: number) {
  const s = size ?? LOGO_SIZE
  const scale = s / 44 // SVG viewBox is 44×44
  const cx = x + s / 2
  const cy = y + s / 2
  const arcR = 14 * scale
  const strokeW = Math.max(0.4, 2.5 * scale)

  // Three rotation offsets (0°, 120°, 240°) — matching the SVG <g transform="rotate(...)">
  const offsets = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]
  for (const offset of offsets) {
    // The SVG arc goes from ~M12.6,11.6 to ~M31.4,11.6 which is roughly
    // from -67° to -113° on a circle of radius 14 centred at (22,22).
    // In PDF coordinates (Y-up), we flip the Y component.
    const startAngle = offset + (150 * Math.PI) / 180
    const endAngle = offset + (30 * Math.PI) / 180
    const steps = 12
    const deltaAngle = (endAngle - startAngle) / steps

    // Draw arc as short line segments
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + i * deltaAngle
      const a2 = startAngle + (i + 1) * deltaAngle
      page.drawLine({
        start: { x: cx + arcR * Math.cos(a1), y: cy + arcR * Math.sin(a1) },
        end: { x: cx + arcR * Math.cos(a2), y: cy + arcR * Math.sin(a2) },
        thickness: strokeW,
        color: AMBER,
      })
    }

    // Chevron arrowhead at end of arc
    const tipX = cx + arcR * Math.cos(endAngle)
    const tipY = cy + arcR * Math.sin(endAngle)
    const chevLen = 5 * scale
    const chevAngle1 = endAngle + (2.6) // ~150° from travel direction
    const chevAngle2 = endAngle + (0.8) // ~45° from travel direction
    page.drawLine({
      start: { x: tipX + chevLen * Math.cos(chevAngle1), y: tipY + chevLen * Math.sin(chevAngle1) },
      end: { x: tipX, y: tipY },
      thickness: Math.max(0.3, 2 * scale),
      color: AMBER,
    })
    page.drawLine({
      start: { x: tipX + chevLen * Math.cos(chevAngle2), y: tipY + chevLen * Math.sin(chevAngle2) },
      end: { x: tipX, y: tipY },
      thickness: Math.max(0.3, 2 * scale),
      color: AMBER,
    })
  }
}

/** Truncate text to fit within maxWidth */
function truncateText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + '…', size) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '…'
}

/** Wrap text to fit within maxWidth, return array of lines */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return []
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length > 0 ? lines : ['']
}

/**
 * Estimate the height needed to display a pre-filled value without truncation.
 * Splits by newlines, then wraps each line at contentWidth to count total lines.
 * Returns the larger of defaultH or the calculated height (capped at one page).
 */
function estimateValueHeight(
  text: string,
  font: PDFFont,
  fontSize: number,
  contentWidth: number,
  defaultH: number,
): number {
  if (!text) return defaultH
  const lineH = fontSize * 1.4
  const padding = 8
  const paragraphs = text.split('\n')
  let totalLines = 0
  for (const para of paragraphs) {
    if (!para.trim()) {
      totalLines += 1
      continue
    }
    const wrapped = wrapText(para, font, fontSize, contentWidth - 8) // 4pt padding each side
    totalLines += wrapped.length
  }
  const needed = totalLines * lineH + padding
  // Cap at available page content height to avoid blank overflow
  const maxH = CONTENT_TOP - CONTENT_BOTTOM - FIELD_LABEL_HEIGHT
  return Math.min(Math.max(defaultH, needed), maxH)
}

/** Draw a field input box (border + background) */
function drawFieldBox(page: PDFPage, x: number, y: number, w: number, h: number) {
  // Background
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: WHITE,
    borderColor: FIELD_BORDER,
    borderWidth: 0.5,
  })
}

/** Generate a unique field name for the PDF form */
let fieldCounter = 0
function uniqueFieldName(prefix: string): string {
  fieldCounter++
  return `${prefix}_${fieldCounter}`
}

// ─── Prompt / hint helpers ───────────────────────────────────────────────────

/** Render placeholder / prompt text as a grey hint line below the field label */
function renderPlaceholder(
  cursor: LayoutCursor,
  placeholder: string | undefined,
  indent: number = 0,
): void {
  if (!placeholder) return
  const maxW = CONTENT_W - indent
  const lines = wrapText(placeholder, cursor.fonts.oblique, 8, maxW)
  for (const line of lines) {
    cursor.ensureSpace(12)
    cursor.page.drawText(line, {
      x: ML + indent,
      y: cursor.y - 8,
      size: 8,
      font: cursor.fonts.oblique,
      color: GREY_TEXT,
    })
    cursor.advance(12)
  }
}

// ─── Field renderers ────────────────────────────────────────────────────────

function renderFieldLabel(
  cursor: LayoutCursor,
  label: string,
  required: boolean = false,
): void {
  cursor.ensureSpace(FIELD_LABEL_HEIGHT)
  const displayLabel = required ? `${label} *` : label
  cursor.page.drawText(truncateText(displayLabel, cursor.fonts.bold, FIELD_LABEL_SIZE, CONTENT_W), {
    x: ML,
    y: cursor.y - FIELD_LABEL_SIZE,
    size: FIELD_LABEL_SIZE,
    font: cursor.fonts.bold,
    color: DARK,
  })
  cursor.advance(FIELD_LABEL_HEIGHT)
}

function renderTextFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: TextField | NumberField | DateField | TimeField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)
  renderPlaceholder(cursor, field.placeholder)

  // Expand height when a pre-filled value is long
  const val = values?.[field.id]
  const valStr = val !== undefined && val !== null && val !== '' ? String(val) : ''
  const fieldH = valStr
    ? estimateValueHeight(valStr, cursor.fonts.regular, 10, CONTENT_W, TEXT_FIELD_H)
    : TEXT_FIELD_H
  const isMultiline = fieldH > TEXT_FIELD_H

  cursor.ensureSpace(fieldH)

  const fieldY = cursor.y - fieldH
  drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, fieldH)

  const textField = form.createTextField(uniqueFieldName(`${sectionId}.${field.id}`))
  if (isMultiline) textField.enableMultiline()
  textField.addToPage(cursor.page, {
    x: ML + 2,
    y: fieldY + 2,
    width: CONTENT_W - 4,
    height: fieldH - 4,
    borderWidth: 0,
  })

  // Set default appearance
  textField.setFontSize(10)

  // Pre-fill value
  if (valStr) {
    textField.setText(valStr)
  }

  cursor.advance(fieldH)
}

function renderTextareaFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: TextareaField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)
  renderPlaceholder(cursor, field.placeholder)

  // Expand height when a pre-filled value is long
  const val = values?.[field.id]
  const valStr = val !== undefined && val !== null && val !== '' ? String(val) : ''
  const fieldH = valStr
    ? estimateValueHeight(valStr, cursor.fonts.regular, 10, CONTENT_W, TEXTAREA_H)
    : TEXTAREA_H

  cursor.ensureSpace(fieldH)

  const fieldY = cursor.y - fieldH
  drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, fieldH)

  const textField = form.createTextField(uniqueFieldName(`${sectionId}.${field.id}`))
  textField.enableMultiline()
  textField.addToPage(cursor.page, {
    x: ML + 2,
    y: fieldY + 2,
    width: CONTENT_W - 4,
    height: fieldH - 4,
    borderWidth: 0,
  })
  textField.setFontSize(10)

  if (valStr) {
    textField.setText(valStr)
  }

  cursor.advance(fieldH)
}

function renderChecklistFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: ChecklistField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)

  const checkedValues = (values?.[field.id] as string[]) || []

  for (const option of field.options) {
    cursor.ensureSpace(CHECKBOX_ROW_H)

    const checkboxY = cursor.y - CHECKBOX_ROW_H

    // Checkbox box
    const boxSize = 11
    drawFieldBox(cursor.page, ML, checkboxY + (CHECKBOX_ROW_H - boxSize) / 2, boxSize, boxSize)

    const checkbox = form.createCheckBox(uniqueFieldName(`${sectionId}.${field.id}.${option.id}`))
    checkbox.addToPage(cursor.page, {
      x: ML + 0.5,
      y: checkboxY + (CHECKBOX_ROW_H - boxSize) / 2 + 0.5,
      width: boxSize - 1,
      height: boxSize - 1,
      borderWidth: 0,
    })

    if (checkedValues.includes(option.id)) {
      checkbox.check()
    }

    // Option label
    cursor.page.drawText(option.label, {
      x: ML + boxSize + 6,
      y: checkboxY + CHECKBOX_ROW_H / 2 - 4,
      size: 9,
      font: cursor.fonts.regular,
      color: DARK,
    })

    cursor.advance(CHECKBOX_ROW_H)
  }
}

function renderSelectFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: SelectField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)
  cursor.ensureSpace(DROPDOWN_H)

  const fieldY = cursor.y - DROPDOWN_H
  drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, DROPDOWN_H)

  const dropdown = form.createDropdown(uniqueFieldName(`${sectionId}.${field.id}`))
  const optionLabels = field.options.map((o) => o.label)
  dropdown.addOptions(optionLabels)
  dropdown.addToPage(cursor.page, {
    x: ML + 2,
    y: fieldY + 2,
    width: CONTENT_W - 4,
    height: DROPDOWN_H - 4,
    borderWidth: 0,
  })
  dropdown.setFontSize(10)

  const val = values?.[field.id]
  if (val && typeof val === 'string') {
    const matchingOption = field.options.find((o) => o.id === val)
    if (matchingOption) {
      dropdown.select(matchingOption.label)
    }
  }

  cursor.advance(DROPDOWN_H)
}

function renderLikertFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: LikertField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)
  cursor.ensureSpace(DROPDOWN_H + 14)

  // Show anchors as hint text
  if (field.anchors && Object.keys(field.anchors).length > 0) {
    const anchorParts = Object.entries(field.anchors)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([k, v]) => `${k} = ${v}`)
    const anchorText = anchorParts.join('  ·  ')
    const lines = wrapText(anchorText, cursor.fonts.regular, 8, CONTENT_W)
    for (const line of lines) {
      cursor.page.drawText(line, {
        x: ML,
        y: cursor.y - 8,
        size: 8,
        font: cursor.fonts.regular,
        color: GREY_TEXT,
      })
      cursor.advance(12)
    }
  }

  cursor.ensureSpace(DROPDOWN_H)
  const fieldY = cursor.y - DROPDOWN_H
  drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, DROPDOWN_H)

  // Create dropdown with numeric options
  const dropdown = form.createDropdown(uniqueFieldName(`${sectionId}.${field.id}`))
  const step = field.step || 1
  const options: string[] = []
  for (let v = field.min; v <= field.max; v += step) {
    const anchor = field.anchors?.[String(v)]
    options.push(anchor ? `${v} — ${anchor}` : String(v))
  }
  dropdown.addOptions(options)
  dropdown.addToPage(cursor.page, {
    x: ML + 2,
    y: fieldY + 2,
    width: CONTENT_W - 4,
    height: DROPDOWN_H - 4,
    borderWidth: 0,
  })
  dropdown.setFontSize(10)

  const val = values?.[field.id]
  if (val !== undefined && val !== null) {
    const numVal = Number(val)
    const anchor = field.anchors?.[String(numVal)]
    const optionStr = anchor ? `${numVal} — ${anchor}` : String(numVal)
    if (options.includes(optionStr)) {
      dropdown.select(optionStr)
    }
  }

  cursor.advance(DROPDOWN_H)
}

function computeColumnWidths(
  cols: { id: string; header: string; type?: string; width?: string }[],
): number[] {
  const NARROW_W = 45 // points — for number columns and explicitly narrow columns
  const numCols = cols.length

  // Equal distribution for small tables (≤4 columns)
  if (numCols <= 4) return cols.map(() => CONTENT_W / numCols)

  // Proportional widths: narrow for number/narrow cols, rest shared equally
  let narrowTotal = 0
  let wideCount = 0
  for (const col of cols) {
    if (col.type === 'number' || col.width === 'narrow') {
      narrowTotal += NARROW_W
    } else {
      wideCount++
    }
  }

  const wideW = wideCount > 0 ? (CONTENT_W - narrowTotal) / wideCount : CONTENT_W / numCols
  return cols.map((col) =>
    col.type === 'number' || col.width === 'narrow' ? NARROW_W : wideW,
  )
}

function renderTableFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: TableField | HierarchyField,
  sectionId: string,
  values?: Record<string, unknown>,
  isDiary?: boolean,
): void {
  renderFieldLabel(cursor, field.label, field.required)

  const cols = field.columns
  const numCols = cols.length
  const colWidths = computeColumnWidths(cols)

  // Use taller header with wrapping for wide tables (>5 cols)
  const headerH = numCols > 5 ? 28 : TABLE_HEADER_H
  const headerFontSize = numCols > 5 ? 7 : 8

  // Header row
  cursor.ensureSpace(headerH)
  const headerY = cursor.y - headerH

  // Header background
  cursor.page.drawRectangle({
    x: ML,
    y: headerY,
    width: CONTENT_W,
    height: headerH,
    color: LIGHT_BG,
    borderColor: FIELD_BORDER,
    borderWidth: 0.5,
  })

  let colX = ML
  for (let c = 0; c < numCols; c++) {
    const cw = colWidths[c]
    // Column separator
    if (c > 0) {
      cursor.page.drawLine({
        start: { x: colX, y: headerY },
        end: { x: colX, y: headerY + headerH },
        thickness: 0.5,
        color: FIELD_BORDER,
      })
    }
    // Header text — wrap for wide tables, truncate for narrow
    const headerLines = wrapText(cols[c].header, cursor.fonts.bold, headerFontSize, cw - 8)
    const lineH = headerFontSize + 2
    const textBlockH = headerLines.length * lineH
    const startY = headerY + (headerH + textBlockH) / 2 - headerFontSize
    for (let l = 0; l < Math.min(headerLines.length, 2); l++) {
      cursor.page.drawText(headerLines[l], {
        x: colX + 4,
        y: startY - l * lineH,
        size: headerFontSize,
        font: cursor.fonts.bold,
        color: DARK,
      })
    }
    colX += cw
  }
  cursor.advance(headerH)

  // Data rows
  const tableValues = (values?.[field.id] as Record<string, unknown>[] | undefined) || []

  // Base row height — taller for diary worksheets
  const baseRowH = isDiary ? DIARY_TABLE_ROW_H : TABLE_ROW_H

  // Smart blank row heuristic for paper-usable PDFs:
  //   - If min_rows is already ≥ 3, trust it (e.g. 7 for weekly schedules)
  //   - If max_rows is high (≥10) but min_rows is low, use 5 (implies "fill many in")
  //   - Otherwise default to 3 blank rows
  const minR = field.min_rows || 1
  const maxR = field.max_rows || 20
  const blankMinRows = minR >= 3 ? minR : maxR >= 10 ? 5 : 3

  // For diary worksheets with no pre-filled values, fill the remaining page
  let numRows: number
  let rowH: number

  if (isDiary && tableValues.length === 0) {
    // Calculate how many rows fit in the remaining page space
    const availableSpace = cursor.y - CONTENT_BOTTOM
    const rowsThatFit = Math.floor(availableSpace / baseRowH)
    numRows = Math.max(blankMinRows, rowsThatFit)
    // Distribute space evenly across rows to fill the page
    rowH = Math.max(baseRowH, availableSpace / numRows)
  } else {
    numRows = Math.max(blankMinRows, tableValues.length)
    rowH = baseRowH
  }

  for (let r = 0; r < numRows; r++) {
    cursor.ensureSpace(rowH)
    const rowY = cursor.y - rowH
    const rowVals = tableValues[r] || {}

    // Row border
    cursor.page.drawRectangle({
      x: ML,
      y: rowY,
      width: CONTENT_W,
      height: rowH,
      borderColor: FIELD_BORDER,
      borderWidth: 0.5,
      color: WHITE,
    })

    let cellX = ML
    for (let c = 0; c < numCols; c++) {
      const cw = colWidths[c]

      // Column separator
      if (c > 0) {
        cursor.page.drawLine({
          start: { x: cellX, y: rowY },
          end: { x: cellX, y: rowY + rowH },
          thickness: 0.5,
          color: FIELD_BORDER,
        })
      }

      // Cell text field
      const cellField = form.createTextField(
        uniqueFieldName(`${sectionId}.${field.id}.r${r}.${cols[c].id}`)
      )
      cellField.addToPage(cursor.page, {
        x: cellX + 2,
        y: rowY + 2,
        width: cw - 4,
        height: rowH - 4,
        borderWidth: 0,
      })
      cellField.setFontSize(9)

      const cellVal = rowVals[cols[c].id]
      if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
        cellField.setText(String(cellVal))
      }
      cellX += cw
    }
    cursor.advance(rowH)
  }
}

function renderSafetyPlanFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: SafetyPlanField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)

  const fieldValues = (values?.[field.id] as Record<string, unknown>) || {}

  // Layout constants for the step circle
  const circleR = 10          // radius of the numbered circle
  const circleDiameter = circleR * 2
  const circleGap = 10        // gap between circle and text
  const indentX = circleDiameter + circleGap  // indent for label + fields

  for (const step of field.steps) {
    cursor.ensureSpace(FIELD_LABEL_HEIGHT + TEXTAREA_H + 8)

    // Draw step number circle
    const circleCx = ML + circleR
    const circleCy = cursor.y - circleR
    const circleColour = step.highlight === 'red' ? RED : DARK
    cursor.page.drawCircle({
      x: circleCx,
      y: circleCy,
      size: circleR,
      color: circleColour,
    })

    // Step number (white text centred in circle)
    const numText = String(step.step)
    const numWidth = cursor.fonts.bold.widthOfTextAtSize(numText, 10)
    cursor.page.drawText(numText, {
      x: circleCx - numWidth / 2,
      y: circleCy - 3.5,
      size: 10,
      font: cursor.fonts.bold,
      color: WHITE,
    })

    // Step label (right of circle, vertically centred)
    cursor.page.drawText(step.label, {
      x: ML + indentX,
      y: cursor.y - FIELD_LABEL_SIZE,
      size: FIELD_LABEL_SIZE,
      font: cursor.fonts.bold,
      color: DARK,
    })
    cursor.advance(FIELD_LABEL_HEIGHT + 2)

    // Hint text (indented, tighter to label)
    if (step.hint) {
      const hintMaxW = CONTENT_W - indentX
      const hintLines = wrapText(step.hint, cursor.fonts.oblique, 8, hintMaxW)
      for (const line of hintLines) {
        cursor.ensureSpace(11)
        cursor.page.drawText(line, {
          x: ML + indentX,
          y: cursor.y - 8,
          size: 8,
          font: cursor.fonts.oblique,
          color: GREY_TEXT,
        })
        cursor.advance(11)
      }
      cursor.advance(2) // Small gap between hint and field
    }

    // Textarea for each sub-field in the step (indented to align with label)
    for (const subField of step.fields) {
      // Sub-field placeholder as prompt text
      renderPlaceholder(cursor, subField.placeholder, indentX)

      const fieldW = CONTENT_W - indentX
      cursor.ensureSpace(TEXTAREA_H)
      const fieldY = cursor.y - TEXTAREA_H
      drawFieldBox(cursor.page, ML + indentX, fieldY, fieldW, TEXTAREA_H)

      const textField = form.createTextField(
        uniqueFieldName(`${sectionId}.${field.id}.${step.id}.${subField.id}`)
      )
      textField.enableMultiline()
      textField.addToPage(cursor.page, {
        x: ML + indentX + 2,
        y: fieldY + 2,
        width: fieldW - 4,
        height: TEXTAREA_H - 4,
        borderWidth: 0,
      })
      textField.setFontSize(10)

      const stepVals = fieldValues[step.id] as Record<string, unknown> | undefined
      const val = stepVals?.[subField.id]
      if (val !== undefined && val !== null && val !== '') {
        textField.setText(String(val))
      }

      cursor.advance(TEXTAREA_H)
    }

    cursor.advance(FIELD_GAP + 4) // Extra gap between steps
  }
}

function renderDecisionTreeFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: DecisionTreeField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)

  const fieldValues = (values?.[field.id] as Record<string, unknown>) || {}

  // Question text
  cursor.ensureSpace(20)
  const questionLines = wrapText(field.question, cursor.fonts.bold, 10, CONTENT_W)
  for (const line of questionLines) {
    cursor.page.drawText(line, {
      x: ML,
      y: cursor.y - 10,
      size: 10,
      font: cursor.fonts.bold,
      color: DARK,
    })
    cursor.advance(14)
  }
  cursor.advance(6)

  // Yes branch
  for (const branchKey of ['yes', 'no'] as const) {
    const branch = field.branches[branchKey]
    const branchColor = branchKey === 'yes'
      ? rgb(34 / 255, 197 / 255, 94 / 255)
      : rgb(239 / 255, 68 / 255, 68 / 255)

    cursor.ensureSpace(FIELD_LABEL_HEIGHT + TEXTAREA_H)

    // Branch header
    cursor.page.drawText(`${branchKey.toUpperCase()}: ${branch.label}`, {
      x: ML,
      y: cursor.y - FIELD_LABEL_SIZE,
      size: FIELD_LABEL_SIZE,
      font: cursor.fonts.bold,
      color: branchColor,
    })
    cursor.advance(FIELD_LABEL_HEIGHT)

    // Branch fields
    if (branch.fields) {
      const branchVals = (fieldValues[branchKey] as Record<string, unknown>) || {}
      for (const subField of branch.fields) {
        const height = subField.type === 'textarea' ? TEXTAREA_H : TEXT_FIELD_H
        cursor.ensureSpace(FIELD_LABEL_HEIGHT + height)

        // Sub-field label
        if (subField.label) {
          cursor.page.drawText(subField.label, {
            x: ML + 8,
            y: cursor.y - 9,
            size: 9,
            font: cursor.fonts.regular,
            color: DARK,
          })
          cursor.advance(14)
        }

        // Sub-field placeholder prompt
        renderPlaceholder(cursor, subField.placeholder, 8)

        const fieldY = cursor.y - height
        drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, height)

        const textField = form.createTextField(
          uniqueFieldName(`${sectionId}.${field.id}.${branchKey}.${subField.id}`)
        )
        if (subField.type === 'textarea') textField.enableMultiline()
        textField.addToPage(cursor.page, {
          x: ML + 2,
          y: fieldY + 2,
          width: CONTENT_W - 4,
          height: height - 4,
          borderWidth: 0,
        })
        textField.setFontSize(10)

        const val = branchVals[subField.id]
        if (val !== undefined && val !== null && val !== '') {
          textField.setText(String(val))
        }

        cursor.advance(height + FIELD_GAP)
      }
    }

    // Outcome text
    if (branch.outcome) {
      cursor.ensureSpace(16)
      cursor.page.drawText(`→ ${branch.outcome}`, {
        x: ML + 8,
        y: cursor.y - 9,
        size: 9,
        font: cursor.fonts.oblique,
        color: GREY_TEXT,
      })
      cursor.advance(16)
    }

    cursor.advance(FIELD_GAP)
  }
}

function renderFormulationFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: FormulationField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)

  // Linearised layout: list nodes vertically with their fields
  const formulationValues = (values?.[field.id] as { nodes?: Record<string, Record<string, unknown>> }) || {}
  const nodeValues = formulationValues.nodes || {}

  if (field.nodes && field.nodes.length > 0) {
    for (const node of field.nodes) {
      // Node header with domain colour indicator
      cursor.ensureSpace(FIELD_LABEL_HEIGHT + TEXT_FIELD_H)

      // Colour indicator dot
      const dotSize = 8
      try {
        const hex = node.domain_colour || '#e4a930'
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255
        cursor.page.drawCircle({
          x: ML + dotSize / 2,
          y: cursor.y - FIELD_LABEL_SIZE + dotSize / 2 - 1,
          size: dotSize / 2,
          color: rgb(r, g, b),
        })
      } catch {
        // Skip colour indicator if parsing fails
      }

      cursor.page.drawText(node.label, {
        x: ML + dotSize + 6,
        y: cursor.y - FIELD_LABEL_SIZE,
        size: FIELD_LABEL_SIZE,
        font: cursor.fonts.bold,
        color: DARK,
      })
      cursor.advance(FIELD_LABEL_HEIGHT)

      // Node description
      if (node.description) {
        const descLines = wrapText(node.description, cursor.fonts.regular, 8, CONTENT_W - dotSize - 6)
        for (const line of descLines) {
          cursor.ensureSpace(12)
          cursor.page.drawText(line, {
            x: ML + dotSize + 6,
            y: cursor.y - 8,
            size: 8,
            font: cursor.fonts.regular,
            color: GREY_TEXT,
          })
          cursor.advance(12)
        }
      }

      // Node fields
      const nVals = nodeValues[node.id] || {}
      for (const nf of node.fields) {
        const isMultiline = nf.type === 'textarea'
        const h = isMultiline ? TEXTAREA_H : TEXT_FIELD_H

        cursor.ensureSpace(h + 14)

        // Sub-label
        if (nf.label) {
          cursor.page.drawText(nf.label, {
            x: ML + dotSize + 6,
            y: cursor.y - 9,
            size: 9,
            font: cursor.fonts.regular,
            color: DARK,
          })
          cursor.advance(14)
        }

        // Sub-field placeholder prompt
        renderPlaceholder(cursor, nf.placeholder, dotSize + 6)

        const fieldY = cursor.y - h
        drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, h)

        if (nf.type === 'checklist' && nf.options) {
          // Render as checkboxes
          for (const opt of nf.options) {
            cursor.ensureSpace(CHECKBOX_ROW_H)
            const cbY = cursor.y - CHECKBOX_ROW_H
            const boxSize = 11
            drawFieldBox(cursor.page, ML + 4, cbY + (CHECKBOX_ROW_H - boxSize) / 2, boxSize, boxSize)

            const cb = form.createCheckBox(
              uniqueFieldName(`${sectionId}.${field.id}.${node.id}.${nf.id}.${opt.id}`)
            )
            cb.addToPage(cursor.page, {
              x: ML + 4.5,
              y: cbY + (CHECKBOX_ROW_H - boxSize) / 2 + 0.5,
              width: boxSize - 1,
              height: boxSize - 1,
              borderWidth: 0,
            })

            const nfChecked = (nVals[nf.id] as string[]) || []
            if (nfChecked.includes(opt.id)) cb.check()

            cursor.page.drawText(opt.label, {
              x: ML + 4 + boxSize + 6,
              y: cbY + CHECKBOX_ROW_H / 2 - 4,
              size: 9,
              font: cursor.fonts.regular,
              color: DARK,
            })
            cursor.advance(CHECKBOX_ROW_H)
          }
        } else if (nf.type === 'select' && nf.options) {
          const dd = form.createDropdown(
            uniqueFieldName(`${sectionId}.${field.id}.${node.id}.${nf.id}`)
          )
          dd.addOptions(nf.options.map((o) => o.label))
          dd.addToPage(cursor.page, {
            x: ML + 2,
            y: fieldY + 2,
            width: CONTENT_W - 4,
            height: h - 4,
            borderWidth: 0,
          })
          dd.setFontSize(10)
          cursor.advance(h)
        } else if (nf.type === 'likert') {
          // Likert as dropdown
          const dd = form.createDropdown(
            uniqueFieldName(`${sectionId}.${field.id}.${node.id}.${nf.id}`)
          )
          const step = nf.step || 1
          const opts: string[] = []
          for (let v = (nf.min || 0); v <= (nf.max || 10); v += step) {
            const anchor = nf.anchors?.[String(v)]
            opts.push(anchor ? `${v} — ${anchor}` : String(v))
          }
          dd.addOptions(opts)
          dd.addToPage(cursor.page, {
            x: ML + 2,
            y: fieldY + 2,
            width: CONTENT_W - 4,
            height: h - 4,
            borderWidth: 0,
          })
          dd.setFontSize(10)
          cursor.advance(h)
        } else {
          // Default: text field
          const tf = form.createTextField(
            uniqueFieldName(`${sectionId}.${field.id}.${node.id}.${nf.id}`)
          )
          if (isMultiline) tf.enableMultiline()
          tf.addToPage(cursor.page, {
            x: ML + 2,
            y: fieldY + 2,
            width: CONTENT_W - 4,
            height: h - 4,
            borderWidth: 0,
          })
          tf.setFontSize(10)

          const val = nVals[nf.id]
          if (val !== undefined && val !== null && val !== '') {
            tf.setText(String(val))
          }
          cursor.advance(h)
        }

        cursor.advance(FIELD_GAP / 2)
      }

      cursor.advance(FIELD_GAP)
    }
  } else if (field.item_template) {
    // Legacy vicious flower / dynamic petals — show template fields
    const templateFields = field.item_template.fields
    cursor.ensureSpace(16)
    cursor.page.drawText('(Dynamic items — add entries in the app)', {
      x: ML,
      y: cursor.y - 9,
      size: 9,
      font: cursor.fonts.oblique,
      color: GREY_TEXT,
    })
    cursor.advance(16)

    for (const tf of templateFields) {
      const h = tf.type === 'textarea' ? TEXTAREA_H : TEXT_FIELD_H
      cursor.ensureSpace(14 + h)

      if (tf.label) {
        cursor.page.drawText(tf.label, {
          x: ML,
          y: cursor.y - 9,
          size: 9,
          font: cursor.fonts.regular,
          color: DARK,
        })
        cursor.advance(14)
      }

      renderPlaceholder(cursor, tf.placeholder)

      const fieldY = cursor.y - h
      drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, h)

      const textField = form.createTextField(
        uniqueFieldName(`${sectionId}.${field.id}.template.${tf.id}`)
      )
      if (tf.type === 'textarea') textField.enableMultiline()
      textField.addToPage(cursor.page, {
        x: ML + 2,
        y: fieldY + 2,
        width: CONTENT_W - 4,
        height: h - 4,
        borderWidth: 0,
      })
      textField.setFontSize(10)

      cursor.advance(h + FIELD_GAP / 2)
    }
  }
}

function renderRecordFieldPdf(
  cursor: LayoutCursor,
  form: PDFForm,
  field: RecordField,
  sectionId: string,
  values?: Record<string, unknown>,
): void {
  renderFieldLabel(cursor, field.label, field.required)

  const recordValues = (values?.[field.id] as { records?: Record<string, unknown>[] }) || {}
  // Smart blank record heuristic for paper-usable PDFs:
  //   - If max_records is high (≥10), use 5 (implies "fill many in" like a thought log)
  //   - Otherwise use 3
  const maxRec = field.max_records || 20
  const blankRecordCount = Math.min(maxRec >= 10 ? 5 : 3, maxRec)
  const defaultRecords: Record<string, unknown>[] = Array.from({ length: blankRecordCount }, () => ({}))
  const records = recordValues.records || defaultRecords

  for (let rIdx = 0; rIdx < records.length; rIdx++) {
    const record = records[rIdx]

    // Record header
    if (records.length > 1) {
      cursor.ensureSpace(20)
      cursor.page.drawText(`Record ${rIdx + 1}`, {
        x: ML,
        y: cursor.y - 10,
        size: 10,
        font: cursor.fonts.bold,
        color: DARK,
      })
      cursor.advance(20)
    }

    // Groups within the record
    for (const group of field.groups) {
      cursor.ensureSpace(FIELD_LABEL_HEIGHT)
      cursor.page.drawText(group.header, {
        x: ML,
        y: cursor.y - 9,
        size: 9,
        font: cursor.fonts.bold,
        color: DARK,
      })
      cursor.advance(14)

      const groupVals = (record[group.id] as Record<string, unknown>) || {}

      for (const sf of group.fields) {
        const isMultiline = sf.type === 'textarea'
        const h = isMultiline ? TEXTAREA_H : TEXT_FIELD_H

        cursor.ensureSpace(h + 14)

        if (sf.label) {
          cursor.page.drawText(sf.label, {
            x: ML + 8,
            y: cursor.y - 9,
            size: 9,
            font: cursor.fonts.regular,
            color: DARK,
          })
          cursor.advance(14)
        }

        // Sub-field placeholder prompt
        renderPlaceholder(cursor, sf.placeholder, 8)

        if (sf.type === 'checklist' && sf.options) {
          for (const opt of sf.options) {
            cursor.ensureSpace(CHECKBOX_ROW_H)
            const cbY = cursor.y - CHECKBOX_ROW_H
            const boxSize = 11
            drawFieldBox(cursor.page, ML + 8, cbY + (CHECKBOX_ROW_H - boxSize) / 2, boxSize, boxSize)

            const cb = form.createCheckBox(
              uniqueFieldName(`${sectionId}.${field.id}.r${rIdx}.${group.id}.${sf.id}.${opt.id}`)
            )
            cb.addToPage(cursor.page, {
              x: ML + 8.5,
              y: cbY + (CHECKBOX_ROW_H - boxSize) / 2 + 0.5,
              width: boxSize - 1,
              height: boxSize - 1,
              borderWidth: 0,
            })
            const checked = (groupVals[sf.id] as string[]) || []
            if (checked.includes(opt.id)) cb.check()

            cursor.page.drawText(opt.label, {
              x: ML + 8 + boxSize + 6,
              y: cbY + CHECKBOX_ROW_H / 2 - 4,
              size: 9,
              font: cursor.fonts.regular,
              color: DARK,
            })
            cursor.advance(CHECKBOX_ROW_H)
          }
        } else if (sf.type === 'select' && sf.options) {
          const fieldY = cursor.y - DROPDOWN_H
          drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, DROPDOWN_H)

          const dd = form.createDropdown(
            uniqueFieldName(`${sectionId}.${field.id}.r${rIdx}.${group.id}.${sf.id}`)
          )
          dd.addOptions(sf.options.map((o) => o.label))
          dd.addToPage(cursor.page, {
            x: ML + 2,
            y: fieldY + 2,
            width: CONTENT_W - 4,
            height: DROPDOWN_H - 4,
            borderWidth: 0,
          })
          dd.setFontSize(10)

          const val = groupVals[sf.id]
          if (val && typeof val === 'string') {
            const match = sf.options.find((o) => o.id === val)
            if (match) dd.select(match.label)
          }
          cursor.advance(DROPDOWN_H)
        } else if (sf.type === 'likert') {
          const fieldY = cursor.y - DROPDOWN_H
          drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, DROPDOWN_H)

          const dd = form.createDropdown(
            uniqueFieldName(`${sectionId}.${field.id}.r${rIdx}.${group.id}.${sf.id}`)
          )
          const step = sf.step || 1
          const opts: string[] = []
          for (let v = (sf.min || 0); v <= (sf.max || 10); v += step) {
            const anchor = sf.anchors?.[String(v)]
            opts.push(anchor ? `${v} — ${anchor}` : String(v))
          }
          dd.addOptions(opts)
          dd.addToPage(cursor.page, {
            x: ML + 2,
            y: fieldY + 2,
            width: CONTENT_W - 4,
            height: DROPDOWN_H - 4,
            borderWidth: 0,
          })
          dd.setFontSize(10)
          cursor.advance(DROPDOWN_H)
        } else {
          const fieldY = cursor.y - h
          drawFieldBox(cursor.page, ML, fieldY, CONTENT_W, h)

          const tf = form.createTextField(
            uniqueFieldName(`${sectionId}.${field.id}.r${rIdx}.${group.id}.${sf.id}`)
          )
          if (isMultiline) tf.enableMultiline()
          tf.addToPage(cursor.page, {
            x: ML + 2,
            y: fieldY + 2,
            width: CONTENT_W - 4,
            height: h - 4,
            borderWidth: 0,
          })
          tf.setFontSize(10)

          const val = groupVals[sf.id]
          if (val !== undefined && val !== null && val !== '') {
            tf.setText(String(val))
          }
          cursor.advance(h)
        }

        cursor.advance(FIELD_GAP / 2)
      }

      cursor.advance(FIELD_GAP / 2)
    }

    if (rIdx < records.length - 1) {
      // Separator between records
      cursor.ensureSpace(SECTION_GAP)
      cursor.page.drawLine({
        start: { x: ML, y: cursor.y - SECTION_GAP / 2 },
        end: { x: PAGE_W - MR, y: cursor.y - SECTION_GAP / 2 },
        thickness: 0.3,
        color: GREY_LINE,
      })
      cursor.advance(SECTION_GAP)
    }
  }
}

function renderComputedFieldPdf(
  cursor: LayoutCursor,
  field: ComputedField,
): void {
  renderFieldLabel(cursor, field.label, false)
  cursor.ensureSpace(16)
  cursor.page.drawText('Calculated automatically in the app', {
    x: ML,
    y: cursor.y - 9,
    size: 9,
    font: cursor.fonts.oblique,
    color: GREY_TEXT,
  })
  cursor.advance(16)
}

/** Render an "Entry N" header with separator line (for diary/multi-entry worksheets) */
function renderEntryHeader(
  cursor: LayoutCursor,
  entryNum: number,
  fonts: { regular: PDFFont; bold: PDFFont; oblique: PDFFont },
) {
  cursor.ensureSpace(SECTION_TITLE_HEIGHT + 12)
  cursor.page.drawText(`Entry ${entryNum}`, {
    x: ML,
    y: cursor.y - SECTION_TITLE_SIZE,
    size: SECTION_TITLE_SIZE,
    font: fonts.bold,
    color: DARK,
  })
  cursor.advance(SECTION_TITLE_HEIGHT)

  // Separator line below entry header
  cursor.page.drawLine({
    start: { x: ML, y: cursor.y + 4 },
    end: { x: PAGE_W - MR, y: cursor.y + 4 },
    thickness: 0.5,
    color: GREY_LINE,
  })
  cursor.advance(8)
}

// ─── Section & field dispatch ───────────────────────────────────────────────

function renderField(
  cursor: LayoutCursor,
  form: PDFForm,
  field: WorksheetField,
  sectionId: string,
  values?: Record<string, unknown>,
  isDiary?: boolean,
): void {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'time':
      renderTextFieldPdf(cursor, form, field, sectionId, values)
      break
    case 'textarea':
      renderTextareaFieldPdf(cursor, form, field as TextareaField, sectionId, values)
      break
    case 'checklist':
      renderChecklistFieldPdf(cursor, form, field as ChecklistField, sectionId, values)
      break
    case 'select':
      renderSelectFieldPdf(cursor, form, field as SelectField, sectionId, values)
      break
    case 'likert':
      renderLikertFieldPdf(cursor, form, field as LikertField, sectionId, values)
      break
    case 'table':
    case 'hierarchy':
      renderTableFieldPdf(cursor, form, field as TableField | HierarchyField, sectionId, values, isDiary)
      break
    case 'safety_plan':
      renderSafetyPlanFieldPdf(cursor, form, field as SafetyPlanField, sectionId, values)
      break
    case 'decision_tree':
      renderDecisionTreeFieldPdf(cursor, form, field as DecisionTreeField, sectionId, values)
      break
    case 'formulation':
      renderFormulationFieldPdf(cursor, form, field as FormulationField, sectionId, values)
      break
    case 'record':
      renderRecordFieldPdf(cursor, form, field as RecordField, sectionId, values)
      break
    case 'computed':
      // Skip computed fields entirely — they're app-only calculations
      // (e.g. belief change, averages) that don't apply to paper
      break
  }
}

function renderSection(
  cursor: LayoutCursor,
  form: PDFForm,
  section: WorksheetSection,
  values?: Record<string, unknown>,
  isDiary?: boolean,
): void {
  // Section title (or label for safety plan sections) with optional step number
  const sectionHeading = section.title || section.label
  if (sectionHeading) {
    cursor.ensureSpace(SECTION_TITLE_HEIGHT)

    const headingText = section.step
      ? `${section.step}. ${sectionHeading}`
      : sectionHeading

    cursor.page.drawText(
      truncateText(headingText, cursor.fonts.bold, SECTION_TITLE_SIZE, CONTENT_W),
      {
        x: ML,
        y: cursor.y - SECTION_TITLE_SIZE,
        size: SECTION_TITLE_SIZE,
        font: cursor.fonts.bold,
        color: DARK,
      },
    )
    cursor.advance(SECTION_TITLE_HEIGHT)
  }

  // Section hint (used by safety plan steps, decision tree questions, etc.)
  if (section.hint) {
    const hintLines = wrapText(section.hint, cursor.fonts.oblique, SECTION_DESC_SIZE, CONTENT_W)
    for (const line of hintLines) {
      cursor.ensureSpace(SECTION_DESC_LINE_H)
      cursor.page.drawText(line, {
        x: ML,
        y: cursor.y - SECTION_DESC_SIZE,
        size: SECTION_DESC_SIZE,
        font: cursor.fonts.oblique,
        color: GREY_TEXT,
      })
      cursor.advance(SECTION_DESC_LINE_H)
    }
    cursor.advance(4)
  }

  // Section description
  if (section.description) {
    const descLines = wrapText(section.description, cursor.fonts.regular, SECTION_DESC_SIZE, CONTENT_W)
    for (const line of descLines) {
      cursor.ensureSpace(SECTION_DESC_LINE_H)
      cursor.page.drawText(line, {
        x: ML,
        y: cursor.y - SECTION_DESC_SIZE,
        size: SECTION_DESC_SIZE,
        font: cursor.fonts.regular,
        color: GREY_TEXT,
      })
      cursor.advance(SECTION_DESC_LINE_H)
    }
    cursor.advance(4) // Extra gap after description
  }

  // Fields
  for (const field of section.fields) {
    renderField(cursor, form, field, section.id, values, isDiary)
    cursor.advance(FIELD_GAP)
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function generateFillablePdf(options: FillablePdfOptions): Promise<Uint8Array> {
  const {
    schema,
    title,
    description,
    instructions,
    showBranding = true,
    values,
  } = options

  // Reset field counter for each generation
  fieldCounter = 0

  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(title)
  pdfDoc.setProducer('Formulate — formulatetools.co.uk')
  pdfDoc.setCreator('Formulate')

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const fonts = { regular, bold, oblique }

  const form = pdfDoc.getForm()

  // First page
  const firstPage = pdfDoc.addPage([PAGE_W, PAGE_H])
  const pages = [firstPage]

  const cursor = new LayoutCursor(pdfDoc, pages, fonts, showBranding, title)

  // Description text (below header)
  if (description) {
    const descLines = wrapText(description, regular, 9, CONTENT_W)
    for (const line of descLines) {
      cursor.ensureSpace(13)
      cursor.page.drawText(line, {
        x: ML,
        y: cursor.y - 9,
        size: 9,
        font: regular,
        color: GREY_TEXT,
      })
      cursor.advance(13)
    }
    cursor.advance(12) // Clear gap before instructions or first section
  }

  // Instructions callout box (amber-themed, matching HTML export)
  if (instructions) {
    const instPadding = 12
    const instFontSize = 9
    const instLineH = 13
    const instMaxW = CONTENT_W - instPadding * 2
    const instLines = wrapText(instructions, regular, instFontSize, instMaxW)
    const boxH = instPadding * 2 + instLines.length * instLineH

    cursor.ensureSpace(boxH + 4)

    const boxY = cursor.y - boxH
    // Amber-light background
    cursor.page.drawRectangle({
      x: ML,
      y: boxY,
      width: CONTENT_W,
      height: boxH,
      color: AMBER_LIGHT,
      borderColor: rgb(228 / 255, 169 / 255, 48 / 255),
      borderWidth: 0.3,
      borderOpacity: 0.3,
    })

    // Instructions text inside the box
    let textY = cursor.y - instPadding
    for (const line of instLines) {
      cursor.page.drawText(line, {
        x: ML + instPadding,
        y: textY - instFontSize,
        size: instFontSize,
        font: regular,
        color: DARK,
      })
      textY -= instLineH
    }

    cursor.advance(boxH + 8)
  }

  // Handle diary/repeatable worksheets and multi-entry responses
  const isDiary = schema.repeatable === true
  if (isDiary) {
    if (values && isMultiEntryResponse(values)) {
      // Pre-filled multi-entry: render each submitted entry
      const entries = (values as { _entries: Record<string, unknown>[] })._entries
      for (let entryIdx = 0; entryIdx < entries.length; entryIdx++) {
        renderEntryHeader(cursor, entryIdx + 1, fonts)
        for (const section of schema.sections) {
          renderSection(cursor, form, section, entries[entryIdx], isDiary)
          cursor.advance(SECTION_GAP)
        }
      }
    } else {
      // Blank diary export: render 3 blank entry sets (or max_entries if smaller)
      const blankEntries = Math.min(3, schema.max_entries || 7)
      for (let entryIdx = 0; entryIdx < blankEntries; entryIdx++) {
        renderEntryHeader(cursor, entryIdx + 1, fonts)
        for (const section of schema.sections) {
          renderSection(cursor, form, section, undefined, isDiary)
          cursor.advance(SECTION_GAP)
        }
      }
    }
  } else {
    // Non-diary: single set of sections
    for (const section of schema.sections) {
      renderSection(cursor, form, section, values, false)
      cursor.advance(SECTION_GAP)
    }
  }

  // Now draw headers and footers on all pages (need total page count)
  const totalPages = cursor.pages.length
  for (let i = 0; i < totalPages; i++) {
    drawHeader(cursor.pages[i], i + 1, totalPages, title, fonts)
    drawFooter(cursor.pages[i], showBranding, fonts)
  }

  // Flatten appearance streams for better compatibility
  form.updateFieldAppearances(regular)

  return pdfDoc.save()
}

export async function downloadFillablePdf(options: FillablePdfOptions): Promise<void> {
  const pdfBytes = await generateFillablePdf(options)

  const safeName = options.title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
