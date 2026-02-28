# Formulate — Master Design System

> Single source of truth for visual consistency across the worksheet renderer, PDF export, HTML export, and all UI components. Every design decision in this document is derived from the live codebase.

---

## 1. Brand Identity

### Logo
- **Mark:** Three identical arc-chevron segments rotated 120°, stroke-based SVG
- **Colour:** `#e4a930` (brand amber), customisable via `color` prop
- **Wordmark:** "formulate" (lowercase), DM Sans semibold, tracking-tight
- **Sizes:** sm (20px), md (24px), lg (32px)
- **Component:** `src/components/ui/logo.tsx`

### Typography
- **Font family:** DM Sans (variable, weights 300–700)
- **Fallback stack:** -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
- **CSS variable:** `--font-dm-sans`
- **Import:** `src/app/layout.tsx`

| Use | Size | Weight | Tailwind |
|-----|------|--------|----------|
| Body text | 14px | 400 | `text-sm` |
| Field labels | 14px | 500 | `text-sm font-medium` |
| Section titles | 18px | 600 | `text-lg font-semibold` |
| Hints / secondary | 12px | 400 | `text-xs` |
| Domain labels | 0.65rem | 600 | `text-[0.65rem] font-semibold uppercase tracking-wider` |
| PDF worksheet title | 11pt | 700 | — |
| PDF table headers | 9pt | 600 | — |
| PDF footer | 7pt | 400 | — |

---

## 2. Colour Palette

### Brand Colours

| Token | Hex | Usage |
|-------|-----|-------|
| Brand (amber) | `#e4a930` | Primary accent, CTA highlights, focus rings, logo |
| Brand light | `#fdf6e3` | Amber tinted backgrounds |
| Brand dark | `#c48d1e` | Hover states on brand buttons |
| Brand text | `#9a6e15` | Text on amber backgrounds |

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#fafaf8` | Page background (warm off-white) |
| Surface | `#ffffff` | Cards, panels, inputs |
| Foreground | `#2d2d2d` | Primary body text (charcoal) |
| Primary-100 | `#f1f0ee` | Subtle backgrounds |
| Primary-200 | `#e8e8e6` | Borders, dividers |
| Primary-300 | `#d4d4d0` | Heavier borders |
| Primary-400 | `#999999` | Placeholder text |
| Primary-500 | `#888888` | Secondary text |
| Primary-600 | `#666666` | Muted labels |
| Primary-700 | `#444444` | Field labels, secondary emphasis |
| Primary-800 | `#2d2d2d` | Headings, primary text |
| Primary-900 | `#1a1a1a` | Maximum emphasis |

### Dark Mode (Bourbon Warm)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#141210` | Page background |
| Surface | `#1c1a17` | Cards, panels |
| Foreground | `#e8e5e0` | Primary text |
| Primary-200 | `#2a2725` | Borders |
| Primary-800 | `#e8e5e0` | Headings |

### Semantic Colours

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Success | `#16a34a` | `#22c55e` | Positive states, completion |
| Warning | `#e4a930` | `#fbbf24` | Caution, brand accent |
| Danger | `#dc2626` | `#ef4444` | Errors, destructive actions |
| Info | `#3b82f6` | — | Informational highlights |

### Source Files
- `src/app/globals.css` — all CSS custom properties
- `src/lib/domain-colors.ts` — clinical domain colours

---

## 3. Domain Colours (Formulation Nodes)

Used across the worksheet renderer, formulation layouts, and HTML/PDF export for clinical formulation diagrams.

### Curated Domains

| Domain | Hex | Background | Border | Text |
|--------|-----|------------|--------|------|
| Situation | `#8b8e94` | `#f3f2f0` | `#a8a7a3` | `#6b6a66` |
| Thoughts | `#5b7fb5` | `#eef2f8` | `#8faed0` | `#4a6e96` |
| Emotions | `#c46b6b` | `#f8efef` | `#d4a0a0` | `#a05858` |
| Physical | `#6b9e7e` | `#eff5f1` | `#9ec5aa` | `#5a8a6a` |
| Behaviour | `#8b7ab5` | `#f2f0f6` | `#b0a5cc` | `#7668a0` |
| Reassurance | `#d4a44a` | `#fdf6e3` | `#d4a44a` | `#8a6e2e` |
| Core Beliefs | `#a07850` | `#f6f1eb` | `#c4a880` | `#806040` |
| Relationships | `#b87090` | `#f6eff2` | `#d0a0b4` | `#986078` |
| Motivation | `#c48a5a` | `#f6f0ea` | `#d4b090` | `#a07048` |
| Mindfulness | `#6b9e96` | `#eff5f3` | `#9ec5be` | `#5a8a82` |
| Threat (CFT) | `#c46b6b` | `#f8efef` | `#d4a0a0` | `#a05858` |
| Drive (CFT) | `#5b7fb5` | `#eef2f8` | `#8faed0` | `#4a6e96` |
| Soothing (CFT) | `#6b9e7e` | `#eff5f1` | `#9ec5aa` | `#5a8a6a` |

### Custom Colour Opacity Rules
- **Light mode:** bg = `{hex}14` (8%), border = `{hex}80` (50%), text = `{hex}` (100%)
- **Dark mode:** bg = `{hex}18` (9%), border = `{hex}60` (38%), text = `{hex}cc` (80%)

### Default (Empty) Domain
- bg: `#ffffff`, border: `#e5e7eb`, text: `#374151`

---

## 4. Spacing & Layout

### Spacing Scale (Tailwind, 1 unit = 4px)

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight inline spacing |
| `gap-1.5` | 6px | Checklist item spacing |
| `gap-2` | 8px | Button icon gaps |
| `gap-3` | 12px | Form field gaps, grid gaps |
| `gap-4` | 16px | Standard section content spacing |
| `gap-8` | 32px | Between worksheet sections |
| `space-y-4` | 16px | Fields within a section |
| `space-y-6` | 24px | Print section spacing |
| `space-y-8` | 32px | Between sections on screen |

### Component Padding

| Context | Padding |
|---------|---------|
| Inputs | `px-3 py-2` |
| Buttons (md) | `px-4 py-2` |
| Buttons (sm) | `px-3 py-1.5` |
| Buttons (lg) | `px-6 py-3` |
| Cards / panels | `p-4` or `p-5` |
| Dense table cells | `px-2 py-1.5` |
| Table header cells | `px-3 py-2` |
| Formulation nodes | `p-3` or `p-4` |
| HTML export sections | `24px` |

### PDF Page Setup (A4)

| Property | Value | Notes |
|----------|-------|-------|
| Page size | 210mm × 297mm | A4 |
| Top margin | 15mm | |
| Right margin | 15mm | |
| Bottom margin | 12mm | |
| Left margin | **20mm** | NHS hole-punch allowance |
| Accent bar | 2mm height, full width | Brand amber at top |
| Logo | 5mm × 5mm | 5mm from top |
| Title | 11pt bold | 12mm from top |
| Separator | 0.3pt line | 15mm from top |
| Footer | 7pt, centred, amber | |
| Page number | 7pt, top right | |

---

## 5. Borders & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Standard — inputs, buttons, table wrappers |
| `rounded-xl` | 12px | Cards, formulation nodes |
| `rounded-2xl` | 16px | Emphasis containers, vicious flower centre |
| `rounded-full` | 50% | Pills, badges, safety plan step circles |
| Border width | 1px | Standard borders |
| Border width | 2px | Emphasis, formulation domain borders, decision tree |
| Border width | 3px | HTML export header accent |
| Border colour | `primary-200` | Light borders |
| Border colour | `primary-300` | Medium borders |

### Print Overrides
- Reduce `rounded-xl` to 8px, `rounded-lg` to 6px
- Remove all shadows
- Borders become `1px solid #ccc`

---

## 6. Shadows

### Button Shadows (CSS Variables)

| Token | Value |
|-------|-------|
| `--shadow-btn` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| `--shadow-btn-hover` | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` |
| Dark `--shadow-btn` | `0 1px 3px rgba(0,0,0,0.3)` |

### General
- `shadow-sm` for subtle card elevation
- `hover:shadow` with transition on card hover
- **Print/PDF:** all shadows removed

---

## 7. Button Variants

### Primary (Charcoal)
```
bg-primary-800 text-white font-semibold shadow-[var(--shadow-btn)]
hover:bg-primary-900 hover:shadow-[var(--shadow-btn-hover)] hover:-translate-y-px
```

### Accent (Brand Amber)
```
bg-brand text-[#6b4d0f] font-semibold shadow-[var(--shadow-btn)]
hover:bg-brand-dark hover:text-white hover:shadow-[var(--shadow-btn-hover)] hover:-translate-y-px
```

### Secondary (Outline)
```
border border-primary-200 bg-transparent text-primary-700
hover:bg-primary-50 hover:border-primary-300
```

### Ghost
```
bg-transparent text-primary-600
hover:text-primary-800 hover:underline
```

### Sizes
- **sm:** `px-3 py-1.5 text-xs`
- **md:** `px-4 py-2 text-sm`
- **lg:** `px-6 py-3 text-sm`

### Source File
- `src/components/ui/button-variants.ts`

---

## 8. Field Type Styling

### Text / Number Inputs
```
block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm
text-primary-900 placeholder-primary-400
focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30
```
- Mobile: min-height 44px (prevents iOS zoom)

### Textarea
- Same border/focus as text inputs
- `resize: vertical`
- Min-height: 100px (mobile), 60px (desktop)

### Range Slider (Likert)
- Track: 100% width, 6px height
- Thumb: 20px diameter, `background: var(--brand)`
- Accent: `accent-brand`

### Select
- Same styling as text inputs
- Custom chevron via background SVG

### Checklist
- Gap: `gap-1.5` between items
- Selected badge: `rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark`
- Checkmark icon: `h-3 w-3 text-brand`

### Table
- Wrapper: `overflow-x-auto rounded-lg border border-primary-200`
- Header: `bg-primary-50 border-b border-primary-200`
- Header cells: `px-3 py-2 text-left text-xs font-medium text-primary-600`
- Body cells: `px-3 py-2 text-primary-700`
- Row dividers: `divide-y divide-primary-100`
- Cell inputs: `border-0 bg-transparent px-2 py-1.5 text-sm`

### Computed Field
- Container: `bg-amber-50 border-l-4 border-brand` with dashed border
- Value: `font-semibold text-sm text-primary-700`

### Hierarchy (Priority Bar)
- Item: `rounded-lg border border-primary-100 bg-surface p-2.5`
- Value badge: `w-10 text-center text-sm font-semibold`
- Gradient bar: `h-5 w-16 rounded bg-primary-50`
- Gradient: low `#e8f5e9` → mid `#e4a930` → high `#dc2626`

### Safety Plan
- Step circle: 32px, `bg-primary-800 text-white` (warning steps: `bg-red-600`)
- Content: `flex-1` layout

### Decision Tree
- Question box: `bg-amber-50 border-2 border-brand rounded-lg p-4`
- Yes/No buttons: border 2px, hover → success/danger colours
- Outcome: `p-3`, success = `bg-green-50 border-green-200`, danger = `bg-red-50 border-red-200`

---

## 9. Formulation Layout Patterns

### Cross-Sectional (Hot Cross Bun)
- Situation: full width (top)
- Middle: `grid grid-cols-1 sm:grid-cols-3 gap-3` (thoughts, emotions, physical)
- Behaviour: full width (bottom)
- Node cards: `rounded-xl border-2 p-4` with domain colour
- Connecting arrows: hidden on mobile

### Vicious Flower (Radial)
- Centre: `mx-auto max-w-md rounded-2xl border-2 border-amber-400 bg-amber-50 p-5`
- Petals: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`
- Petal cards: `rounded-xl border-2 p-4` with domain colour
- Add button: `border-dashed border-primary-300 px-4 py-2`

### Longitudinal (Beckian)
- Sections: `rounded-xl border-2 p-4`
- Normal: `border-primary-200 bg-surface`
- Amber highlight: `border-amber-300 bg-amber-50/50`
- Red dashed: `border-red-300 border-dashed bg-red-50/30`
- Four-quadrant: `grid grid-cols-2 gap-3` within section
- Arrow connectors: `h-6 w-6 text-primary-300`

### Cycle (Node-Based Spatial)
- SVG canvas: 700px width, dynamic height
- Nodes: positioned absolutely with domain-coloured backgrounds
- Connections: SVG paths with optional arrowheads and curve
- Arrow markers: stroke-based, `markerWidth/Height: 6`

---

## 10. HTML Export Specifics

Self-contained `.html` files use embedded CSS with these overrides from the main design system:

| Token | HTML Export Value | Notes |
|-------|-----------------|-------|
| `--bg` | `#f8fafc` | Slightly cooler than app's `#fafaf8` |
| `--surface` | `#ffffff` | Same |
| `--border` | `#e2e8f0` | Slightly different from `primary-200` |
| `--text-900` | `#0f172a` | Darker than app's `#1a1a1a` |
| `--brand` | `#e4a930` | Same |
| `--radius` | `12px` | Matches `rounded-xl` |
| `--radius-sm` | `8px` | Matches `rounded-lg` |
| Max width | 640px | Narrower than app layout |
| Header | 3px brand top border | Distinctive from app header |

### Source File
- `src/lib/utils/html-worksheet-export.ts`

---

## 11. Print Overrides

Applied via `@media print` in `globals.css`:

- **Hidden:** nav, header, footer, `.no-print`, all buttons
- **Shown:** `.print-only`
- **Font:** 11pt base
- **Colours:** `print-color-adjust: exact` / `-webkit-print-color-adjust: exact`
- **Borders:** 1px solid #ccc
- **Table headers:** background `#f5f5f5`
- **Shadows:** removed entirely
- **Radius:** reduced (xl → 8px, lg → 6px)
- **Page breaks:** `page-break-inside: avoid` on sections, `page-break-after: avoid` on headings
- **Formulation nodes:** text 9pt, inputs 8pt, textarea min-height 40px

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Default | 0px+ | Single column, stacked layout |
| `sm` | 640px | Multi-column grids activate, formulation side-by-side |
| `lg` | 1024px | 3-column petal grid in vicious flower |

- All inputs: min-height 44px on mobile (prevents iOS zoom)
- Tables: horizontal scroll on mobile (`overflow-x-auto`)
- Formulation spatial diagrams: scroll-capable on mobile

---

## 13. Key Source Files

| File | Governs |
|------|---------|
| `src/app/globals.css` | CSS custom properties, dark mode, print styles |
| `src/lib/domain-colors.ts` | Clinical domain colour mappings |
| `src/app/layout.tsx` | Font import, theme provider |
| `src/components/ui/button-variants.ts` | Button class definitions |
| `src/components/ui/button.tsx` | Button component |
| `src/components/ui/logo.tsx` | Logo mark and wordmark |
| `src/components/worksheets/worksheet-renderer.tsx` | All field type rendering |
| `src/components/worksheets/fields/formulation-layout.tsx` | Cross-sectional, vicious flower, longitudinal |
| `src/lib/utils/html-worksheet-export.ts` | Self-contained HTML generation |
| `src/app/api/homework/pdf-download/route.ts` | PDF generation via jsPDF |
