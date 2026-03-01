/**
 * Generates a self-contained, interactive HTML file from a WorksheetSchema.
 * Clients can open the file in any browser and complete the worksheet offline.
 * Includes Formulate branding, interactive fields (sliders, tables, decision trees),
 * and localStorage persistence so progress is saved between sessions.
 */
import type {
  WorksheetSchema,
  WorksheetSection,
  WorksheetField,
  LikertField,
  ChecklistField,
  SelectField,
  NumberField,
  TableField,
  HierarchyField,
  SafetyPlanField,
  DecisionTreeField,
  FormulationField,
  FormulationNode,
  FormulationConnection,
  FormulationLayoutPattern,
  TableColumn,
  RecordField,
  RecordGroup,
  RecordSubField,
} from '@/types/worksheet'
import { getColourFromHex } from '@/lib/domain-colors'

// ── Utilities ──

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitize(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
}

// ── Spatial Layout Engine (for formulation diagrams) ──

interface ExportNodeLayout {
  id: string; x: number; y: number; width: number; height: number; shape: 'rect' | 'circle' | 'pill'
}
interface ExportConnectionLayout {
  d: string; dashed: boolean; markerStart: boolean; markerEnd: boolean; colour?: string
}
interface ExportLayoutResult {
  nodes: ExportNodeLayout[]; connections: ExportConnectionLayout[]; totalHeight: number
}

function getEdgePointExport(
  cx: number, cy: number, w: number, h: number, shape: string,
  tx: number, ty: number
): { x: number; y: number } {
  const angle = Math.atan2(ty - cy, tx - cx)
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }
  const hw = w / 2, hh = h / 2
  const absCos = Math.abs(Math.cos(angle)), absSin = Math.abs(Math.sin(angle))
  let ex: number, ey: number
  if (hw * absSin < hh * absCos) {
    ex = cx + hw * Math.sign(Math.cos(angle))
    ey = cy + hw * Math.tan(angle) * Math.sign(Math.cos(angle))
  } else {
    ex = cx + hh / Math.tan(angle) * Math.sign(Math.sin(angle))
    ey = cy + hh * Math.sign(Math.sin(angle))
  }
  return { x: ex, y: ey }
}

function straightPathExport(from: ExportNodeLayout, to: ExportNodeLayout): string {
  const fcx = from.x + from.width / 2, fcy = from.y + from.height / 2
  const tcx = to.x + to.width / 2, tcy = to.y + to.height / 2
  const p1 = getEdgePointExport(fcx, fcy, from.width, from.height, from.shape, tcx, tcy)
  const p2 = getEdgePointExport(tcx, tcy, to.width, to.height, to.shape, fcx, fcy)
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
}

function curvedPathExport(from: ExportNodeLayout, to: ExportNodeLayout, curvature = 0.3): string {
  const fcx = from.x + from.width / 2, fcy = from.y + from.height / 2
  const tcx = to.x + to.width / 2, tcy = to.y + to.height / 2
  const p1 = getEdgePointExport(fcx, fcy, from.width, from.height, from.shape, tcx, tcy)
  const p2 = getEdgePointExport(tcx, tcy, to.width, to.height, to.shape, fcx, fcy)
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
  const dx = p2.x - p1.x, dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nx = -dy / dist, ny = dx / dist
  const cpx = mx + nx * dist * curvature, cpy = my + ny * dist * curvature
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
}

function buildExportConnections(
  connections: FormulationConnection[],
  nodeMap: Map<string, ExportNodeLayout>,
  pathStyle: 'straight' | 'curved',
  schemaNodes: FormulationNode[]
): ExportConnectionLayout[] {
  const colourMap = new Map<string, string>()
  for (const n of schemaNodes) colourMap.set(n.id, n.domain_colour)

  return connections.map(conn => {
    const from = nodeMap.get(conn.from), to = nodeMap.get(conn.to)
    if (!from || !to) return null
    const d = pathStyle === 'curved' ? curvedPathExport(from, to) : straightPathExport(from, to)
    const isDashed = conn.style === 'arrow_dashed' || conn.style === 'line_dashed'
    const hasArrow = conn.style === 'arrow' || conn.style === 'arrow_dashed' || conn.style === 'inhibitory'
    return {
      d, dashed: isDashed,
      markerStart: hasArrow && conn.direction === 'both',
      markerEnd: hasArrow,
      colour: colourMap.get(conn.from) || colourMap.get(conn.to),
    }
  }).filter(Boolean) as ExportConnectionLayout[]
}

/** Fixed export width for spatial diagrams (fits well inside A4 margins) */
const EXPORT_W = 700

function layoutCrossSectionalExport(nodes: FormulationNode[], connections: FormulationConnection[]): ExportLayoutResult {
  const bySlot: Record<string, FormulationNode> = {}
  for (const n of nodes) bySlot[n.slot] = n
  const nodeW = 160, nodeH = 120, cx = EXPORT_W / 2
  const triggerW = 220, triggerH = 90
  const diamondRadius = 150
  const gapBelowTrigger = nodeH / 2 + 30
  const diamondCy = triggerH + gapBelowTrigger + diamondRadius
  const layouts: ExportNodeLayout[] = []
  if (bySlot['top']) layouts.push({ id: bySlot['top'].id, x: cx - triggerW / 2, y: 0, width: triggerW, height: triggerH, shape: 'rect' })
  const slots: [string, number, number][] = [
    ['left', cx - diamondRadius - nodeW / 2, diamondCy - nodeH / 2],
    ['centre', cx - nodeW / 2, diamondCy - diamondRadius - nodeH / 2],
    ['right', cx + diamondRadius - nodeW / 2, diamondCy - nodeH / 2],
    ['bottom', cx - nodeW / 2, diamondCy + diamondRadius - nodeH / 2],
  ]
  for (const [slot, x, y] of slots) {
    if (bySlot[slot]) layouts.push({ id: bySlot[slot].id, x, y, width: nodeW, height: nodeH, shape: 'rect' })
  }
  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = layouts.reduce((max, n) => Math.max(max, n.y + n.height), 0) + 20
  return { nodes: layouts, connections: buildExportConnections(connections, nodeMap, 'straight', nodes), totalHeight }
}

function layoutRadialExport(nodes: FormulationNode[], connections: FormulationConnection[]): ExportLayoutResult {
  const centre = nodes.find(n => n.slot === 'centre')
  const petals = nodes.filter(n => n.slot !== 'centre')
  const centreSize = 200, petalW = 170, petalH = 120
  const radius = centreSize / 2 + Math.max(petalW, petalH) / 2 + 45
  const cx = EXPORT_W / 2, cy = radius + centreSize / 2 + 10
  const layouts: ExportNodeLayout[] = []
  if (centre) layouts.push({ id: centre.id, x: cx - centreSize / 2, y: cy - centreSize / 2, width: centreSize, height: centreSize, shape: 'circle' })
  const angleStep = (2 * Math.PI) / petals.length, startAngle = -Math.PI / 2
  for (let i = 0; i < petals.length; i++) {
    const angle = startAngle + i * angleStep
    layouts.push({ id: petals[i].id, x: cx + radius * Math.cos(angle) - petalW / 2, y: cy + radius * Math.sin(angle) - petalH / 2, width: petalW, height: petalH, shape: 'pill' })
  }
  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = layouts.reduce((max, n) => Math.max(max, n.y + n.height), 0) + 20
  return { nodes: layouts, connections: buildExportConnections(connections, nodeMap, 'curved', nodes), totalHeight }
}

function layoutVerticalFlowExport(nodes: FormulationNode[], connections: FormulationConnection[]): ExportLayoutResult {
  const steps = nodes.filter(n => n.slot.startsWith('step-')).sort((a, b) => parseInt(a.slot.split('-')[1]) - parseInt(b.slot.split('-')[1]))
  const gridNodes = nodes.filter(n => n.slot.startsWith('grid-')).sort((a, b) => parseInt(a.slot.split('-')[1]) - parseInt(b.slot.split('-')[1]))
  const stepW = 340, stepH = 110, gap = 50, cx = EXPORT_W / 2
  const layouts: ExportNodeLayout[] = []
  let y = 0
  for (const step of steps) {
    layouts.push({ id: step.id, x: cx - stepW / 2, y, width: stepW, height: stepH, shape: 'rect' })
    y += stepH + gap
  }
  if (gridNodes.length > 0) {
    const gridW = 155, gridH = 100, gridGap = 16, gridTotalW = gridW * 2 + gridGap, gridStartX = cx - gridTotalW / 2
    for (let i = 0; i < gridNodes.length && i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2)
      layouts.push({ id: gridNodes[i].id, x: gridStartX + col * (gridW + gridGap), y: y + row * (gridH + gridGap), width: gridW, height: gridH, shape: 'rect' })
    }
    y += Math.ceil(Math.min(gridNodes.length, 4) / 2) * (gridH + gridGap)
  }
  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  return { nodes: layouts, connections: buildExportConnections(connections, nodeMap, 'straight', nodes), totalHeight: y + 10 }
}

function layoutCycleExport(nodes: FormulationNode[], connections: FormulationConnection[]): ExportLayoutResult {
  const sorted = [...nodes].sort((a, b) => parseInt(a.slot.replace('cycle-', '')) - parseInt(b.slot.replace('cycle-', '')))
  const n = sorted.length, nodeW = 170, nodeH = 120, cx = EXPORT_W / 2
  const radius = Math.min(150 + n * 10, EXPORT_W * 0.32), cy = radius + nodeH / 2 + 10
  const layouts: ExportNodeLayout[] = []
  const startAngle = -Math.PI / 2, angleStep = (2 * Math.PI) / n
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    layouts.push({ id: sorted[i].id, x: cx + radius * Math.cos(angle) - nodeW / 2, y: cy + radius * Math.sin(angle) - nodeH / 2, width: nodeW, height: nodeH, shape: 'rect' })
  }
  const nodeMap = new Map(layouts.map(nl => [nl.id, nl]))
  const totalHeight = layouts.reduce((max, nl) => Math.max(max, nl.y + nl.height), 0) + 20
  return { nodes: layouts, connections: buildExportConnections(connections, nodeMap, 'curved', nodes), totalHeight }
}

function layoutThreeSystemsExport(nodes: FormulationNode[], connections: FormulationConnection[]): ExportLayoutResult {
  const bySlot: Record<string, FormulationNode> = {}
  for (const n of nodes) bySlot[n.slot] = n
  const nodeW = 180, nodeH = 130, cx = EXPORT_W / 2
  const topY = 10, bottomY = topY + 260, spread = 210
  const layouts: ExportNodeLayout[] = []
  if (bySlot['system-0']) layouts.push({ id: bySlot['system-0'].id, x: cx - nodeW / 2, y: topY, width: nodeW, height: nodeH, shape: 'rect' })
  if (bySlot['system-1']) layouts.push({ id: bySlot['system-1'].id, x: cx - spread - nodeW / 2, y: bottomY, width: nodeW, height: nodeH, shape: 'rect' })
  if (bySlot['system-2']) layouts.push({ id: bySlot['system-2'].id, x: cx + spread - nodeW / 2, y: bottomY, width: nodeW, height: nodeH, shape: 'rect' })
  if (bySlot['centre']) {
    const cs = 130, centreY = topY + (bottomY - topY) * 0.55
    layouts.push({ id: bySlot['centre'].id, x: cx - cs / 2, y: centreY - cs / 2, width: cs, height: cs, shape: 'circle' })
  }
  const nodeMap = new Map(layouts.map(nl => [nl.id, nl]))
  const totalHeight = layouts.reduce((max, nl) => Math.max(max, nl.y + nl.height), 0) + 20
  return { nodes: layouts, connections: buildExportConnections(connections, nodeMap, 'straight', nodes), totalHeight }
}

function computeExportLayout(layout: string, nodes: FormulationNode[], connections: FormulationConnection[]): ExportLayoutResult {
  switch (layout) {
    case 'cross_sectional': return layoutCrossSectionalExport(nodes, connections)
    case 'radial': return layoutRadialExport(nodes, connections)
    case 'vertical_flow': return layoutVerticalFlowExport(nodes, connections)
    case 'cycle': return layoutCycleExport(nodes, connections)
    case 'three_systems': return layoutThreeSystemsExport(nodes, connections)
    default: {
      // Fallback: vertical stack
      let y = 0
      const layouts: ExportNodeLayout[] = nodes.map(n => {
        const nl: ExportNodeLayout = { id: n.id, x: 0, y, width: EXPORT_W, height: 140, shape: 'rect' }
        y += 152
        return nl
      })
      const nodeMap = new Map(layouts.map(nl => [nl.id, nl]))
      return { nodes: layouts, connections: buildExportConnections(connections, nodeMap, 'straight', nodes), totalHeight: y + 8 }
    }
  }
}

// ── CSS ──

function generateCss(): string {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --text-900: #0f172a;
      --text-800: #1e293b;
      --text-700: #334155;
      --text-600: #475569;
      --text-500: #64748b;
      --text-400: #94a3b8;
      --text-300: #cbd5e1;
      --brand: #e4a930;
      --brand-light: #fdf6e3;
      --green: #16a34a;
      --green-light: #f0fdf4;
      --green-border: #bbf7d0;
      --red: #dc2626;
      --red-light: #fef2f2;
      --red-border: #fecaca;
      --amber-light: #fff7ed;
      --radius: 12px;
      --radius-sm: 8px;
    }

    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text-800);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container { max-width: 640px; margin: 0 auto; padding: 0 16px; }

    /* Header */
    header {
      border-top: 3px solid var(--brand);
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      padding: 12px 0;
    }
    .header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-icon { flex-shrink: 0; }
    .logo-text { font-size: 14px; font-weight: 600; color: var(--text-800); }

    /* Main */
    main { padding: 32px 0; }

    .worksheet-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-900);
      margin-bottom: 8px;
    }
    .worksheet-description {
      font-size: 14px;
      color: var(--text-500);
      margin-bottom: 16px;
    }
    .worksheet-instructions {
      background: var(--brand-light);
      border: 1px solid rgba(228, 169, 48, 0.2);
      border-radius: var(--radius);
      padding: 16px;
      font-size: 14px;
      color: var(--text-700);
      margin-bottom: 24px;
    }

    /* Sections */
    .section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-900);
      margin-bottom: 4px;
    }
    .section-description {
      font-size: 13px;
      color: var(--text-500);
      margin-bottom: 16px;
    }

    /* Fields */
    .field { margin-bottom: 20px; }
    .field:last-child { margin-bottom: 0; }
    .field-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-700);
      margin-bottom: 6px;
    }
    .field-label .required { color: var(--red); margin-left: 2px; }

    input[type="text"],
    input[type="number"],
    input[type="date"],
    input[type="time"],
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text-800);
      transition: border-color 0.15s, box-shadow 0.15s;
      outline: none;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(228, 169, 48, 0.15);
    }
    textarea { resize: vertical; min-height: 100px; }

    /* Likert / Range */
    .likert-wrap { padding: 4px 0; }
    .likert-value {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-900);
      margin-bottom: 4px;
    }
    .likert-value small { font-size: 13px; font-weight: 400; color: var(--text-400); }
    input[type="range"] {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: var(--brand);
      cursor: pointer;
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: var(--brand);
      cursor: pointer;
      border: none;
    }
    .likert-anchors {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-400);
    }

    /* Checklist */
    .checklist-group { display: flex; flex-direction: column; gap: 8px; }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s;
    }
    .checklist-item:hover { background: var(--border-light); }
    .checklist-item input[type="checkbox"] {
      width: 18px; height: 18px;
      accent-color: var(--brand);
      cursor: pointer;
    }
    .checklist-item label { cursor: pointer; font-size: 14px; flex: 1; }

    /* Table */
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      font-size: 12px;
      color: var(--text-500);
      background: var(--border-light);
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border-light);
      vertical-align: top;
    }
    td input, td textarea {
      border: 1px solid transparent;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    td input:focus, td textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 2px rgba(228, 169, 48, 0.1);
    }
    td textarea { min-height: 60px; }
    .row-num {
      width: 32px;
      text-align: center;
      color: var(--text-400);
      font-size: 12px;
    }
    .row-remove {
      width: 32px;
      text-align: center;
    }
    .row-remove button {
      background: none;
      border: none;
      color: var(--text-300);
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }
    .row-remove button:hover { color: var(--red); background: var(--red-light); }
    .table-actions { margin-top: 8px; }
    .btn-add-row {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 13px;
      font-family: inherit;
      color: var(--text-600);
      background: var(--border-light);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-add-row:hover { background: var(--border); }

    /* Computed */
    .computed-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--amber-light);
      border: 1px dashed var(--brand);
      border-radius: var(--radius-sm);
      font-size: 14px;
      color: var(--text-600);
    }
    .computed-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--brand);
      background: var(--brand-light);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Safety plan */
    .safety-step {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .step-circle {
      flex-shrink: 0;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--text-800);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }
    .step-circle.red { background: var(--red); }
    .step-content { flex: 1; }
    .step-label { font-size: 15px; font-weight: 600; color: var(--text-900); margin-bottom: 4px; }
    .step-hint { font-size: 13px; color: var(--text-400); font-style: italic; margin-bottom: 8px; }

    /* Decision tree */
    .decision-question {
      background: var(--amber-light);
      border: 2px solid var(--brand);
      border-radius: var(--radius);
      padding: 16px;
      text-align: center;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .decision-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
    }
    .decision-btn {
      padding: 8px 24px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: var(--surface);
      transition: all 0.15s;
    }
    .decision-btn.yes:hover, .decision-btn.yes.active {
      border-color: var(--green);
      background: var(--green-light);
      color: var(--green);
    }
    .decision-btn.no:hover, .decision-btn.no.active {
      border-color: var(--red);
      background: var(--red-light);
      color: var(--red);
    }
    .decision-branch { display: none; }
    .decision-branch.visible { display: block; }
    .decision-outcome {
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 500;
      margin-top: 12px;
    }
    .decision-outcome.green { background: var(--green-light); border: 1px solid var(--green-border); color: var(--green); }
    .decision-outcome.red { background: var(--red-light); border: 1px solid var(--red-border); color: var(--red); }

    /* Formulation simplified (legacy) */
    .formulation-section {
      border-left: 3px solid var(--brand);
      padding-left: 16px;
      margin-bottom: 16px;
    }
    .formulation-domain {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-400);
      margin-bottom: 6px;
    }

    /* Formulation spatial diagram */
    .formulation-spatial {
      position: relative;
      width: 700px;
      margin: 0 auto;
    }
    .formulation-spatial svg {
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
    }
    .formulation-spatial-node {
      position: absolute;
      border-radius: var(--radius);
      padding: 12px 14px;
      border-width: 2px;
      border-style: solid;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .formulation-spatial-node[data-shape="circle"] {
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .formulation-spatial-node[data-shape="pill"] {
      border-radius: 999px;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px 20px;
    }
    .formulation-node-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .formulation-spatial-node .field { margin-bottom: 6px; }
    .formulation-spatial-node .field:last-child { margin-bottom: 0; }
    .formulation-spatial-node textarea { font-size: 12px; min-height: 40px; }
    .formulation-spatial-node input { font-size: 12px; }

    /* Formulation grid fallback (non-spatial) */
    .formulation-nodes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }
    .formulation-node {
      border-radius: var(--radius);
      padding: 16px;
      border-width: 2px;
      border-style: solid;
    }
    .formulation-node .field { margin-bottom: 12px; }
    .formulation-node .field:last-child { margin-bottom: 0; }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding: 24px 0;
      text-align: center;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-400);
    }

    /* Save indicator */
    .save-indicator {
      position: fixed;
      bottom: 16px;
      right: 16px;
      padding: 8px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 12px;
      color: var(--text-400);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .save-indicator.visible { opacity: 1; }

    /* Print styles */
    /* Record field — paginated cards */
    .record-container { position: relative; }
    .record-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .record-nav-group { display: flex; align-items: center; gap: 8px; }
    .record-nav-label { font-size: 13px; font-weight: 600; color: var(--text-600); min-width: 90px; text-align: center; }
    .record-nav button {
      border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px;
      background: var(--surface); cursor: pointer; color: var(--text-500); font-size: 12px;
    }
    .record-nav button:disabled { opacity: 0.3; cursor: not-allowed; }
    .record-nav button:hover:not(:disabled) { background: var(--bg); }
    .record-btn-add {
      border-color: var(--brand) !important; color: var(--brand) !important;
    }
    .record-btn-delete {
      border-color: var(--red-border) !important; color: var(--red) !important;
    }
    .record-card {
      border: 1px solid var(--border); border-radius: var(--radius);
      background: var(--surface); padding: 16px;
    }
    .record-card[data-hidden="true"] { display: none; }
    .record-rows { display: flex; flex-direction: column; gap: 20px; }
    .record-grid {
      display: grid; gap: 16px;
    }
    .record-group-col { display: flex; flex-direction: column; gap: 8px; }
    .record-group-header {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-500);
      border-bottom: 1px solid var(--border-light); padding-bottom: 6px;
    }
    .record-subfield { display: flex; flex-direction: column; gap: 4px; }
    .record-subfield-label { font-size: 11px; font-weight: 500; color: var(--text-500); }
    .record-slider-wrap { display: flex; align-items: center; gap: 8px; }
    .record-slider-wrap input[type="range"] { flex: 1; }
    .record-slider-val { min-width: 40px; text-align: right; font-size: 13px; font-weight: 600; color: var(--text-800); }
    .record-dots { display: flex; justify-content: center; gap: 6px; margin-top: 8px; }
    .record-dot {
      width: 8px; height: 8px; border-radius: 50%; border: none;
      background: var(--border); cursor: pointer; padding: 0;
    }
    .record-dot.active { background: var(--brand); }

    /* Record print table — for PDF/print */
    .record-print-table { display: none; }

    @media (max-width: 768px) {
      .record-grid { grid-template-columns: 1fr !important; }
    }

    @media print {
      .record-container .record-nav { display: none; }
      .record-container .record-dots { display: none; }
      .record-card { display: none !important; }
      .record-print-table { display: block !important; }
      .record-print-table table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
      .record-print-table table:last-child { margin-bottom: 0; }
      .record-print-table th { background: #f8f8f8; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #ddd; }
      .record-print-table td { padding: 6px 8px; border: 1px solid #ddd; vertical-align: top; min-height: 40px; }
    }

    @media print {
      body { background: white; }
      .section { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }
      .save-indicator { display: none; }
      header { border-top: 3px solid var(--brand); border-bottom: 2px solid var(--brand); }
      footer { border-top: 2px solid var(--brand); }
      input[type="range"] { display: none; }
      .likert-value { font-size: 16px; }
      /* Formulation spatial diagram print */
      .formulation-spatial { page-break-inside: avoid; }
      .formulation-spatial svg { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .formulation-spatial-node { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  `
}

// ── Logo SVG (matches LogoIcon) ──

const LOGO_SVG = `<svg width="20" height="20" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(0, 22, 22)"><path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" stroke="#e4a930" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
  <g transform="rotate(120, 22, 22)"><path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" stroke="#e4a930" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
  <g transform="rotate(240, 22, 22)"><path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" stroke="#e4a930" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
</svg>`

// ── Field renderers ──

function renderTextField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="text" id="${esc(field.id)}" name="${esc(field.id)}" placeholder="${esc(field.placeholder || '')}" />
  </div>`
}

function renderTextareaField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <textarea id="${esc(field.id)}" name="${esc(field.id)}" rows="4" placeholder="${esc(field.placeholder || '')}"></textarea>
  </div>`
}

function renderNumberField(field: NumberField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const attrs = [
    field.min !== undefined ? `min="${field.min}"` : '',
    field.max !== undefined ? `max="${field.max}"` : '',
    field.step !== undefined ? `step="${field.step}"` : '',
  ].filter(Boolean).join(' ')
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="number" id="${esc(field.id)}" name="${esc(field.id)}" ${attrs} placeholder="${esc(field.placeholder || '')}" />
  </div>`
}

function renderDateField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="date" id="${esc(field.id)}" name="${esc(field.id)}" />
  </div>`
}

function renderTimeField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="time" id="${esc(field.id)}" name="${esc(field.id)}" />
  </div>`
}

function renderSelectField(field: SelectField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const opts = field.options.map(o =>
    `<option value="${esc(o.id)}">${esc(o.label)}</option>`
  ).join('')
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <select id="${esc(field.id)}" name="${esc(field.id)}">
      <option value="">Select…</option>
      ${opts}
    </select>
  </div>`
}

function renderChecklistField(field: ChecklistField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const items = field.options.map(o => `
    <div class="checklist-item">
      <input type="checkbox" id="${esc(field.id)}_${esc(o.id)}" name="${esc(field.id)}" value="${esc(o.id)}" />
      <label for="${esc(field.id)}_${esc(o.id)}">${esc(o.label)}</label>
    </div>
  `).join('')
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="checklist-group">${items}</div>
  </div>`
}

function renderLikertField(field: LikertField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const step = field.step || 1
  // Build anchor labels
  let anchorsHtml = ''
  if (field.anchors) {
    const entries = Object.entries(field.anchors)
    if (entries.length >= 2) {
      anchorsHtml = `<div class="likert-anchors">
        <span>${esc(entries[0][1])}</span>
        <span>${esc(entries[entries.length - 1][1])}</span>
      </div>`
    }
  }
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="likert-wrap">
      <div class="likert-value"><span id="${esc(field.id)}-val">${field.min}</span> <small>/ ${field.max}</small></div>
      <input type="range" id="${esc(field.id)}" name="${esc(field.id)}" min="${field.min}" max="${field.max}" step="${step}" value="${field.min}" data-likert="true" />
      ${anchorsHtml}
    </div>
  </div>`
}

function renderTableColumnHeaders(columns: TableColumn[]): string {
  const headers = columns.map(c => `<th>${esc(c.header)}</th>`).join('')
  return `<th class="row-num">#</th>${headers}<th class="row-remove"></th>`
}

function renderTableRow(fieldId: string, columns: TableColumn[], rowIndex: number): string {
  const cells = columns.map(c => {
    const cellId = `${fieldId}_r${rowIndex}_${c.id}`
    const attrs = [
      c.min !== undefined ? `min="${c.min}"` : '',
      c.max !== undefined ? `max="${c.max}"` : '',
      c.step !== undefined ? `step="${c.step}"` : '',
    ].filter(Boolean).join(' ')
    if (c.type === 'textarea') {
      return `<td><textarea id="${esc(cellId)}" name="${esc(cellId)}" rows="2" placeholder="${esc(c.header)}"></textarea></td>`
    }
    if (c.type === 'number') {
      return `<td><input type="number" id="${esc(cellId)}" name="${esc(cellId)}" ${attrs} placeholder="${esc(c.header)}" /></td>`
    }
    return `<td><input type="text" id="${esc(cellId)}" name="${esc(cellId)}" placeholder="${esc(c.header)}" /></td>`
  }).join('')
  return `<tr data-row="${rowIndex}">
    <td class="row-num">${rowIndex + 1}</td>
    ${cells}
    <td class="row-remove"><button type="button" onclick="removeRow(this)" title="Remove row">&times;</button></td>
  </tr>`
}

function renderTableField(field: TableField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const minRows = field.min_rows || 1
  const maxRows = field.max_rows || 20
  const rows = Array.from({ length: minRows }, (_, i) =>
    renderTableRow(field.id, field.columns, i)
  ).join('')
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="table-wrap">
      <table data-table="${esc(field.id)}" data-max-rows="${maxRows}" data-min-rows="${minRows}">
        <thead><tr>${renderTableColumnHeaders(field.columns)}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="table-actions">
      <button type="button" class="btn-add-row" onclick="addRow('${esc(field.id)}')" data-add-for="${esc(field.id)}">+ Add row</button>
    </div>
  </div>`
}

function renderHierarchyField(field: HierarchyField): string {
  // Hierarchy renders as a table — sorting handled by JS
  const req = field.required ? '<span class="required">*</span>' : ''
  const minRows = field.min_rows || 3
  const maxRows = field.max_rows || 15
  const rows = Array.from({ length: minRows }, (_, i) =>
    renderTableRow(field.id, field.columns, i)
  ).join('')
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="table-wrap">
      <table data-table="${esc(field.id)}" data-max-rows="${maxRows}" data-min-rows="${minRows}" data-hierarchy="${field.sort_by || ''}" data-sort-dir="${field.sort_direction || 'asc'}">
        <thead><tr>${renderTableColumnHeaders(field.columns)}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="table-actions">
      <button type="button" class="btn-add-row" onclick="addRow('${esc(field.id)}')" data-add-for="${esc(field.id)}">+ Add row</button>
    </div>
  </div>`
}

function renderRecordSubField(fieldId: string, recordIdx: number, groupId: string, sf: RecordSubField): string {
  const elId = `${fieldId}_r${recordIdx}_${groupId}_${sf.id}`
  const label = sf.label ? `<div class="record-subfield-label">${esc(sf.label)}</div>` : ''

  switch (sf.type) {
    case 'textarea':
      return `<div class="record-subfield">${label}
        <textarea id="${esc(elId)}" name="${esc(elId)}" rows="3" placeholder="${esc(sf.placeholder || '')}"></textarea>
      </div>`
    case 'text':
      return `<div class="record-subfield">${label}
        <input type="text" id="${esc(elId)}" name="${esc(elId)}" placeholder="${esc(sf.placeholder || '')}" />
      </div>`
    case 'number': {
      const attrs = [
        sf.min !== undefined ? `min="${sf.min}"` : '',
        sf.max !== undefined ? `max="${sf.max}"` : '',
        sf.step !== undefined ? `step="${sf.step}"` : '',
      ].filter(Boolean).join(' ')
      const suffix = sf.suffix ? `<span style="font-size:11px;color:var(--text-400)">${esc(sf.suffix)}</span>` : ''
      return `<div class="record-subfield">${label}
        <div style="display:flex;align-items:center;gap:6px">
          <input type="number" id="${esc(elId)}" name="${esc(elId)}" ${attrs} placeholder="${esc(sf.placeholder || '')}" style="flex:1" />${suffix}
        </div>
      </div>`
    }
    case 'likert': {
      const min = sf.min ?? 0
      const max = sf.max ?? 100
      const step = sf.step ?? 1
      const suffix = sf.suffix || '%'
      return `<div class="record-subfield">${label}
        <div class="record-slider-wrap">
          <input type="range" id="${esc(elId)}" name="${esc(elId)}" min="${min}" max="${max}" step="${step}" value="${min}" data-likert="1"
            oninput="document.getElementById('${esc(elId)}-val').textContent=this.value+'${esc(suffix)}'" />
          <span class="record-slider-val" id="${esc(elId)}-val">${min}${esc(suffix)}</span>
        </div>
      </div>`
    }
    case 'checklist': {
      const opts = (sf.options || []).map(opt =>
        `<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-700)">
          <input type="checkbox" name="${esc(elId)}" value="${esc(opt.id)}" /> ${esc(opt.label)}
        </label>`
      ).join('')
      return `<div class="record-subfield">${label}<div style="display:flex;flex-direction:column;gap:4px">${opts}</div></div>`
    }
    case 'select': {
      const opts = (sf.options || []).map(opt =>
        `<option value="${esc(opt.id)}">${esc(opt.label)}</option>`
      ).join('')
      return `<div class="record-subfield">${label}
        <select id="${esc(elId)}" name="${esc(elId)}">
          <option value="">${esc(sf.placeholder || 'Select...')}</option>${opts}
        </select>
      </div>`
    }
    default:
      return ''
  }
}

// Max columns per row before groups wrap (matches React component)
const MAX_RECORD_COLS = 3

function renderRecordField(field: RecordField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const minRecords = field.min_records ?? 1
  const maxRecords = field.max_records ?? 20
  const fid = esc(field.id)

  // Chunk groups into rows of max MAX_RECORD_COLS
  const groupRows: RecordGroup[][] = []
  for (let i = 0; i < field.groups.length; i += MAX_RECORD_COLS) {
    groupRows.push(field.groups.slice(i, i + MAX_RECORD_COLS))
  }

  // Build grid columns string for a row of groups
  function rowGridCols(rowGroups: RecordGroup[]): string {
    return rowGroups.map(g => {
      switch (g.width) {
        case 'narrow': return 'minmax(0, 0.7fr)'
        case 'wide': return 'minmax(0, 1.5fr)'
        default: return 'minmax(0, 1fr)'
      }
    }).join(' ')
  }

  // Render initial cards — each card now has multiple grid rows if needed
  const cards = Array.from({ length: minRecords }, (_, ri) => {
    const rowsHtml = groupRows.map(rowGroups => {
      const groupsHtml = rowGroups.map(group => {
        const subFields = group.fields.map(sf =>
          renderRecordSubField(field.id, ri, group.id, sf)
        ).join('')
        return `<div class="record-group-col">
          <div class="record-group-header">${esc(group.header)}</div>
          ${subFields}
        </div>`
      }).join('')
      return `<div class="record-grid" style="grid-template-columns:${rowGridCols(rowGroups)}">${groupsHtml}</div>`
    }).join('')
    return `<div class="record-card" data-record="${fid}" data-record-idx="${ri}" ${ri > 0 ? 'data-hidden="true"' : ''}>
      <div class="record-rows">${rowsHtml}</div>
    </div>`
  }).join('')

  // Dot indicators
  const dots = Array.from({ length: minRecords }, (_, i) =>
    `<button type="button" class="record-dot${i === 0 ? ' active' : ''}" data-record-dot="${fid}" data-dot-idx="${i}" onclick="recordGoTo('${fid}',${i})"></button>`
  ).join('')

  // Print table: split into rows of max MAX_RECORD_COLS to avoid squashing
  const printTables = groupRows.map(rowGroups => {
    const headers = rowGroups.map(g => `<th>${esc(g.header)}</th>`).join('')
    const dataRow = rowGroups.map(() => `<td>&nbsp;</td>`).join('')
    const rows = Array.from({ length: minRecords }, () => `<tr>${dataRow}</tr>`).join('')
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`
  }).join('')

  return `<div class="field record-container" data-record-field="${fid}" data-min-records="${minRecords}" data-max-records="${maxRecords}">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="record-nav">
      <div class="record-nav-group">
        <button type="button" onclick="recordNav('${fid}',-1)">&#8249;</button>
        <span class="record-nav-label" id="${fid}-nav-label">Record 1 of ${minRecords}</span>
        <button type="button" onclick="recordNav('${fid}',1)">&#8250;</button>
      </div>
      <div class="record-nav-group">
        <button type="button" class="record-btn-delete" onclick="recordDelete('${fid}')">Delete</button>
        <button type="button" class="record-btn-add" onclick="recordAdd('${fid}')">+ Add</button>
      </div>
    </div>
    ${cards}
    <div class="record-dots" id="${fid}-dots">${dots}</div>
    <div class="record-print-table">
      ${printTables}
    </div>
  </div>`
}

function renderComputedField(field: WorksheetField): string {
  return `<div class="field">
    <label class="field-label">${esc(field.label)}</label>
    <div class="computed-display">
      <span class="computed-badge">f</span>
      <span>This value is calculated automatically when completed online.</span>
    </div>
  </div>`
}

function renderSafetyPlanField(field: SafetyPlanField): string {
  return field.steps.map(step => {
    const circleClass = step.highlight === 'red' ? 'step-circle red' : 'step-circle'
    const fields = step.fields.map(f => `
      <textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>
    `).join('')
    return `<div class="safety-step">
      <div class="${circleClass}">${step.step}</div>
      <div class="step-content">
        <div class="step-label">${esc(step.label)}</div>
        ${step.hint ? `<div class="step-hint">${esc(step.hint)}</div>` : ''}
        ${fields}
      </div>
    </div>`
  }).join('')
}

function renderDecisionTreeField(field: DecisionTreeField): string {
  const treeId = field.id
  const yesFields = (field.branches.yes.fields || []).map(f => `
    <div class="field" style="margin-top:12px;">
      <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
      ${f.type === 'textarea'
        ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
        : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
      }
    </div>
  `).join('')
  const noFields = (field.branches.no.fields || []).map(f => `
    <div class="field" style="margin-top:12px;">
      <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
      ${f.type === 'textarea'
        ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
        : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
      }
    </div>
  `).join('')

  return `<div class="field">
    <div class="decision-question">${esc(field.question)}</div>
    <div class="decision-buttons">
      <button type="button" class="decision-btn yes" data-tree="${esc(treeId)}" data-branch="yes" onclick="selectBranch('${esc(treeId)}','yes')">
        ${esc(field.branches.yes.label)}
      </button>
      <button type="button" class="decision-btn no" data-tree="${esc(treeId)}" data-branch="no" onclick="selectBranch('${esc(treeId)}','no')">
        ${esc(field.branches.no.label)}
      </button>
    </div>
    <div class="decision-branch" id="${esc(treeId)}-yes">
      ${yesFields}
      <div class="decision-outcome green">${esc(field.branches.yes.outcome)}</div>
    </div>
    <div class="decision-branch" id="${esc(treeId)}-no">
      ${noFields}
      <div class="decision-outcome red">${esc(field.branches.no.outcome)}</div>
    </div>
  </div>`
}

function renderFormulationNodeField(
  fieldId: string,
  nodeId: string,
  nf: FormulationNode['fields'][0]
): string {
  const inputId = `${fieldId}_${nodeId}_${nf.id}`
  const label = nf.label
    ? `<label class="field-label" for="${esc(inputId)}">${esc(nf.label)}</label>`
    : ''

  switch (nf.type) {
    case 'textarea':
      return `<div class="field">${label}<textarea id="${esc(inputId)}" name="${esc(inputId)}" rows="3" placeholder="${esc(nf.placeholder || '')}"></textarea></div>`
    case 'number':
      return `<div class="field">${label}<input type="number" id="${esc(inputId)}" name="${esc(inputId)}" ${nf.min !== undefined ? `min="${nf.min}"` : ''} ${nf.max !== undefined ? `max="${nf.max}"` : ''} placeholder="${esc(nf.placeholder || '')}" /></div>`
    case 'likert': {
      const min = nf.min ?? 0
      const max = nf.max ?? 10
      const step = nf.step ?? 1
      let anchorsHtml = ''
      if (nf.anchors) {
        const entries = Object.entries(nf.anchors)
        if (entries.length >= 2) {
          anchorsHtml = `<div class="likert-anchors"><span>${esc(entries[0][1])}</span><span>${esc(entries[entries.length - 1][1])}</span></div>`
        }
      }
      return `<div class="field">${label}<div class="likert-wrap"><div class="likert-value"><span id="${esc(inputId)}-val">${min}</span> <small>/ ${max}</small></div><input type="range" id="${esc(inputId)}" name="${esc(inputId)}" min="${min}" max="${max}" step="${step}" value="${min}" data-likert="true" />${anchorsHtml}</div></div>`
    }
    case 'checklist': {
      const items = (nf.options || []).map(o =>
        `<div class="checklist-item"><input type="checkbox" id="${esc(inputId)}_${esc(o.id)}" name="${esc(inputId)}" value="${esc(o.id)}" /><label for="${esc(inputId)}_${esc(o.id)}">${esc(o.label)}</label></div>`
      ).join('')
      return `<div class="field">${label}<div class="checklist-group">${items}</div></div>`
    }
    case 'select': {
      const opts = (nf.options || []).map(o =>
        `<option value="${esc(o.id)}">${esc(o.label)}</option>`
      ).join('')
      return `<div class="field">${label}<select id="${esc(inputId)}" name="${esc(inputId)}"><option value="">Select…</option>${opts}</select></div>`
    }
    default:
      return `<div class="field">${label}<input type="text" id="${esc(inputId)}" name="${esc(inputId)}" placeholder="${esc(nf.placeholder || '')}" /></div>`
  }
}

function renderFormulationField(field: FormulationField): string {
  // New format: nodes + layout → render as spatial diagram with SVG connections
  if (field.nodes && field.nodes.length > 0 && field.layout) {
    const nodes = field.nodes
    const connections = field.connections || []
    const layoutPattern = field.layout as string
    const result = computeExportLayout(layoutPattern, nodes, connections)

    // Build a lookup from node id to schema node
    const nodeById = new Map(nodes.map(n => [n.id, n]))

    // Build SVG for connections
    const arrowColour = '#94a3b8'
    // Collect unique colours for per-colour marker defs
    const uniqueColours = new Set<string>()
    for (const c of result.connections) {
      if (c.colour) uniqueColours.add(c.colour)
    }

    const markerDefs = [
      `<marker id="fml-ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="${arrowColour}" /></marker>`,
      `<marker id="fml-ah-r" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto"><polygon points="8 0, 0 3, 8 6" fill="${arrowColour}" /></marker>`,
      ...[...uniqueColours].map(hex => {
        const id = hex.replace('#', '')
        const mc = `${hex}aa`
        return `<marker id="fml-ah-${id}" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="${mc}" /></marker>` +
          `<marker id="fml-ah-r-${id}" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto"><polygon points="8 0, 0 3, 8 6" fill="${mc}" /></marker>`
      })
    ].join('')

    const paths = result.connections.map(c => {
      const colId = c.colour ? c.colour.replace('#', '') : ''
      const stroke = c.colour ? `${c.colour}aa` : arrowColour
      const mEnd = c.markerEnd ? `marker-end="url(#fml-ah${colId ? '-' + colId : ''})"` : ''
      const mStart = c.markerStart ? `marker-start="url(#fml-ah-r${colId ? '-' + colId : ''})"` : ''
      const dash = c.dashed ? 'stroke-dasharray="6,4"' : ''
      return `<path d="${c.d}" fill="none" stroke="${stroke}" stroke-width="1.5" ${dash} ${mEnd} ${mStart} />`
    }).join('')

    const svgHtml = `<svg width="${EXPORT_W}" height="${result.totalHeight}" style="overflow:visible"><defs>${markerDefs}</defs>${paths}</svg>`

    // Build node cards as absolutely positioned divs
    const nodeHtml = result.nodes.map(nl => {
      const schemaNode = nodeById.get(nl.id)
      if (!schemaNode) return ''
      const colours = getColourFromHex(schemaNode.domain_colour)
      const fields = schemaNode.fields.map(nf =>
        renderFormulationNodeField(field.id, schemaNode.id, nf)
      ).join('')

      const borderRadius = nl.shape === 'circle' ? 'border-radius:50%;' : nl.shape === 'pill' ? 'border-radius:999px;' : ''
      return `<div class="formulation-spatial-node" data-shape="${nl.shape}" style="left:${nl.x.toFixed(0)}px;top:${nl.y.toFixed(0)}px;width:${nl.width.toFixed(0)}px;height:${nl.height.toFixed(0)}px;background:${colours.bg};border-color:${colours.border};${borderRadius}">
        <div class="formulation-node-label" style="color:${colours.text};">${esc(schemaNode.label.toUpperCase())}</div>
        ${schemaNode.description ? `<div style="font-size:10px;color:${colours.text};opacity:0.8;margin-bottom:4px;">${esc(schemaNode.description)}</div>` : ''}
        ${fields}
      </div>`
    }).join('')

    const title = field.formulation_config?.show_title && field.formulation_config?.title
      ? `<div class="section-title" style="margin-bottom:12px;">${esc(field.formulation_config.title)}</div>`
      : ''

    return `<div class="field">${title}<div class="formulation-spatial" style="height:${result.totalHeight}px;">${svgHtml}${nodeHtml}</div></div>`
  }

  // New format without layout — fallback to grid cards
  if (field.nodes && field.nodes.length > 0) {
    const nodeCards = field.nodes.map((node) => {
      const colours = getColourFromHex(node.domain_colour)
      const fields = node.fields.map((nf) =>
        renderFormulationNodeField(field.id, node.id, nf)
      ).join('')

      return `<div class="formulation-node" style="background:${colours.bg};border-color:${colours.border};">
        <div class="formulation-node-label" style="color:${colours.text};">${esc(node.label.toUpperCase())}</div>
        ${node.description ? `<div class="section-description">${esc(node.description)}</div>` : ''}
        ${fields}
      </div>`
    }).join('')

    const title = field.formulation_config?.show_title && field.formulation_config?.title
      ? `<div class="section-title" style="margin-bottom:12px;">${esc(field.formulation_config.title)}</div>`
      : ''

    return `<div class="field">${title}<div class="formulation-nodes">${nodeCards}</div></div>`
  }

  // Legacy format: single textarea with domain label
  const domainLabel = field.domain
    ? field.domain.charAt(0).toUpperCase() + field.domain.slice(1)
    : field.label
  return `<div class="field">
    <div class="formulation-section">
      <div class="formulation-domain">${esc(domainLabel)}</div>
      <textarea id="${esc(field.id)}" name="${esc(field.id)}" rows="3" placeholder="${esc(field.placeholder || `Enter ${domainLabel.toLowerCase()}…`)}"></textarea>
    </div>
  </div>`
}

// ── Dispatch field rendering ──

function renderField(field: WorksheetField): string {
  switch (field.type) {
    case 'text': return renderTextField(field)
    case 'textarea': return renderTextareaField(field)
    case 'number': return renderNumberField(field as NumberField)
    case 'date': return renderDateField(field)
    case 'time': return renderTimeField(field)
    case 'select': return renderSelectField(field as SelectField)
    case 'checklist': return renderChecklistField(field as ChecklistField)
    case 'likert': return renderLikertField(field as LikertField)
    case 'table': return renderTableField(field as TableField)
    case 'hierarchy': return renderHierarchyField(field as HierarchyField)
    case 'computed': return renderComputedField(field)
    case 'safety_plan': return renderSafetyPlanField(field as SafetyPlanField)
    case 'decision_tree': return renderDecisionTreeField(field as DecisionTreeField)
    case 'formulation': return renderFormulationField(field as FormulationField)
    case 'record': return renderRecordField(field as RecordField)
    default: return ''
  }
}

// ── Section rendering ──

function renderSection(section: WorksheetSection): string {
  const title = section.title
    ? `<div class="section-title">${esc(section.title)}</div>`
    : ''
  const desc = section.description
    ? `<div class="section-description">${esc(section.description)}</div>`
    : ''
  const fields = section.fields.map(renderField).join('')
  return `<div class="section">${title}${desc}${fields}</div>`
}

// ── Layout dispatchers ──

function renderSafetyPlanLayout(schema: WorksheetSchema): string {
  return schema.sections.map(section => {
    const circleClass = section.highlight === 'red' ? 'step-circle red' : 'step-circle'
    const fields = section.fields.map(f => {
      if (f.type === 'safety_plan') return renderSafetyPlanField(f as SafetyPlanField)
      return renderField(f)
    }).join('')
    if (section.step) {
      return `<div class="section"><div class="safety-step">
        <div class="${circleClass}">${section.step}</div>
        <div class="step-content">
          <div class="step-label">${esc(section.label || section.title || '')}</div>
          ${section.hint ? `<div class="step-hint">${esc(section.hint)}</div>` : ''}
          ${fields}
        </div>
      </div></div>`
    }
    return renderSection(section)
  }).join('')
}

function renderDecisionTreeLayout(schema: WorksheetSchema): string {
  return schema.sections.map(section => {
    // If section has decision tree structure at section level
    if (section.type === 'branch' && section.question && section.branches) {
      const treeId = section.id
      const yesFields = (section.branches.yes.fields || []).map(f => `
        <div class="field" style="margin-top:12px;">
          <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
            : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
          }
        </div>
      `).join('')
      const noFields = (section.branches.no.fields || []).map(f => `
        <div class="field" style="margin-top:12px;">
          <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
            : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
          }
        </div>
      `).join('')
      return `<div class="section">
        <div class="decision-question">${esc(section.question)}</div>
        <div class="decision-buttons">
          <button type="button" class="decision-btn yes" data-tree="${esc(treeId)}" data-branch="yes" onclick="selectBranch('${esc(treeId)}','yes')">
            ${esc(section.branches.yes.label)}
          </button>
          <button type="button" class="decision-btn no" data-tree="${esc(treeId)}" data-branch="no" onclick="selectBranch('${esc(treeId)}','no')">
            ${esc(section.branches.no.label)}
          </button>
        </div>
        <div class="decision-branch" id="${esc(treeId)}-yes">
          ${yesFields}
          <div class="decision-outcome green">${esc(section.branches.yes.outcome)}</div>
        </div>
        <div class="decision-branch" id="${esc(treeId)}-no">
          ${noFields}
          <div class="decision-outcome red">${esc(section.branches.no.outcome)}</div>
        </div>
      </div>`
    }
    return renderSection(section)
  }).join('')
}

function renderFormulationLayout(schema: WorksheetSchema): string {
  // Simplified layout: each section as a labeled block
  return schema.sections.map(section => {
    const domain = section.domain
      ? `<div class="formulation-domain">${esc(section.domain.toUpperCase())}</div>`
      : ''
    const title = section.title
      ? `<div class="section-title">${esc(section.title)}</div>`
      : ''
    const desc = section.description
      ? `<div class="section-description">${esc(section.description)}</div>`
      : ''
    const fields = section.fields.map(renderField).join('')
    return `<div class="section"><div class="formulation-section">${domain}${title}${desc}${fields}</div></div>`
  }).join('')
}

function renderBody(schema: WorksheetSchema): string {
  switch (schema.layout) {
    case 'safety_plan':
      return renderSafetyPlanLayout(schema)
    case 'decision_tree':
      return renderDecisionTreeLayout(schema)
    case 'formulation_cross_sectional':
    case 'formulation_vicious_flower':
    case 'formulation_longitudinal':
      return renderFormulationLayout(schema)
    default:
      return schema.sections.map(renderSection).join('')
  }
}

// ── JavaScript for interactivity ──

function generateJs(schema: WorksheetSchema, storageKey: string): string {
  // Collect table column info for addRow
  const tableFields: { id: string; columns: TableColumn[] }[] = []
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === 'table' || field.type === 'hierarchy') {
        tableFields.push({
          id: field.id,
          columns: (field as TableField).columns,
        })
      }
    }
  }
  const tableColumnsJson = JSON.stringify(
    Object.fromEntries(tableFields.map(t => [t.id, t.columns.map(c => ({ id: c.id, type: c.type, header: c.header }))]))
  )

  // Collect record field info for navigation/add/delete
  const recordFields: { id: string; groups: RecordGroup[] }[] = []
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === 'record') {
        recordFields.push({ id: field.id, groups: (field as RecordField).groups })
      }
    }
  }
  const recordGroupsJson = JSON.stringify(
    Object.fromEntries(recordFields.map(r => [r.id, r.groups.map(g => ({
      id: g.id,
      header: g.header,
      width: g.width || 'normal',
      fields: g.fields.map(sf => ({ id: sf.id, type: sf.type, label: sf.label, placeholder: sf.placeholder, min: sf.min, max: sf.max, step: sf.step, suffix: sf.suffix, options: sf.options })),
    }))]))
  )

  return `
(function() {
  var STORAGE_KEY = ${JSON.stringify(storageKey)};
  var TABLE_COLUMNS = ${tableColumnsJson};
  var RECORD_GROUPS = ${recordGroupsJson};
  var saveTimer = null;

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Save / Load ──

  function collectData() {
    var data = {};
    document.querySelectorAll('input, textarea, select').forEach(function(el) {
      if (el.type === 'checkbox') {
        if (!data[el.name]) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else {
        data[el.id || el.name] = el.value;
      }
    });
    // Save decision tree state
    document.querySelectorAll('.decision-btn.active').forEach(function(btn) {
      data['_tree_' + btn.dataset.tree] = btn.dataset.branch;
    });
    return data;
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
      showSaveIndicator();
    } catch(e) {}
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveData, 500);
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      Object.keys(data).forEach(function(key) {
        if (key.startsWith('_tree_')) {
          var treeId = key.slice(6);
          var branch = data[key];
          selectBranch(treeId, branch);
          return;
        }
        var el = document.getElementById(key);
        if (el) {
          el.value = data[key];
          // Update likert display
          if (el.dataset && el.dataset.likert) {
            var display = document.getElementById(key + '-val');
            if (display) display.textContent = data[key];
          }
        } else {
          // Checklist: multiple checkboxes with same name
          var checkboxes = document.querySelectorAll('input[name="' + key + '"]');
          if (checkboxes.length && Array.isArray(data[key])) {
            checkboxes.forEach(function(cb) {
              cb.checked = data[key].indexOf(cb.value) !== -1;
            });
          }
        }
      });
    } catch(e) {}
  }

  function showSaveIndicator() {
    var indicator = document.getElementById('save-indicator');
    if (indicator) {
      indicator.textContent = 'Saved ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      indicator.classList.add('visible');
      setTimeout(function() { indicator.classList.remove('visible'); }, 2000);
    }
  }

  // ── Likert sliders ──

  document.querySelectorAll('input[type="range"][data-likert]').forEach(function(slider) {
    var display = document.getElementById(slider.id + '-val');
    slider.addEventListener('input', function() {
      if (display) display.textContent = slider.value;
      debouncedSave();
    });
  });

  // ── Table row management ──

  window.addRow = function(tableId) {
    var table = document.querySelector('table[data-table="' + tableId + '"]');
    if (!table) return;
    var maxRows = parseInt(table.dataset.maxRows) || 20;
    var tbody = table.querySelector('tbody');
    var currentRows = tbody.querySelectorAll('tr').length;
    if (currentRows >= maxRows) return;

    var cols = TABLE_COLUMNS[tableId] || [];
    var row = document.createElement('tr');
    row.dataset.row = String(currentRows);

    var numCell = document.createElement('td');
    numCell.className = 'row-num';
    numCell.textContent = String(currentRows + 1);
    row.appendChild(numCell);

    cols.forEach(function(col) {
      var td = document.createElement('td');
      var cellId = tableId + '_r' + currentRows + '_' + col.id;
      var input;
      if (col.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 2;
      } else if (col.type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      input.id = cellId;
      input.name = cellId;
      input.placeholder = col.header;
      input.addEventListener('input', debouncedSave);
      td.appendChild(input);
      row.appendChild(td);
    });

    var removeCell = document.createElement('td');
    removeCell.className = 'row-remove';
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '\\u00d7';
    removeBtn.title = 'Remove row';
    removeBtn.onclick = function() { removeRow(removeBtn); };
    removeCell.appendChild(removeBtn);
    row.appendChild(removeCell);

    tbody.appendChild(row);
    renumberRows(tbody);
    debouncedSave();

    // Hide add button if at max
    if (currentRows + 1 >= maxRows) {
      var btn = document.querySelector('[data-add-for="' + tableId + '"]');
      if (btn) btn.style.display = 'none';
    }
  };

  window.removeRow = function(btn) {
    var row = btn.closest('tr');
    var tbody = row.closest('tbody');
    var table = row.closest('table');
    var minRows = parseInt(table.dataset.minRows) || 1;
    if (tbody.querySelectorAll('tr').length <= minRows) return;
    row.remove();
    renumberRows(tbody);
    debouncedSave();

    // Show add button again
    var tableId = table.dataset.table;
    var addBtn = document.querySelector('[data-add-for="' + tableId + '"]');
    if (addBtn) addBtn.style.display = '';
  };

  function renumberRows(tbody) {
    tbody.querySelectorAll('tr').forEach(function(row, i) {
      var numCell = row.querySelector('.row-num');
      if (numCell) numCell.textContent = String(i + 1);
    });
  }

  // ── Decision tree ──

  window.selectBranch = function(treeId, branch) {
    // Toggle buttons
    document.querySelectorAll('[data-tree="' + treeId + '"]').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.branch === branch);
    });
    // Show/hide branches
    var yesBranch = document.getElementById(treeId + '-yes');
    var noBranch = document.getElementById(treeId + '-no');
    if (yesBranch) yesBranch.classList.toggle('visible', branch === 'yes');
    if (noBranch) noBranch.classList.toggle('visible', branch === 'no');
    debouncedSave();
  };

  // ── Record field navigation ──

  var recordState = {};
  document.querySelectorAll('[data-record-field]').forEach(function(container) {
    var fid = container.dataset.recordField;
    recordState[fid] = { current: 0, total: container.querySelectorAll('.record-card').length };
  });

  function updateRecordUI(fid) {
    var state = recordState[fid];
    if (!state) return;
    var cards = document.querySelectorAll('.record-card[data-record="' + fid + '"]');
    cards.forEach(function(card, i) {
      card.dataset.hidden = (i !== state.current) ? 'true' : 'false';
    });
    var label = document.getElementById(fid + '-nav-label');
    if (label) label.textContent = 'Record ' + (state.current + 1) + ' of ' + state.total;
    var dots = document.querySelectorAll('[data-record-dot="' + fid + '"]');
    dots.forEach(function(dot, i) {
      dot.classList.toggle('active', i === state.current);
    });
  }

  window.recordNav = function(fid, dir) {
    var state = recordState[fid];
    if (!state) return;
    var next = state.current + dir;
    if (next < 0 || next >= state.total) return;
    state.current = next;
    updateRecordUI(fid);
  };

  window.recordGoTo = function(fid, idx) {
    var state = recordState[fid];
    if (!state || idx < 0 || idx >= state.total) return;
    state.current = idx;
    updateRecordUI(fid);
  };

  window.recordAdd = function(fid) {
    var container = document.querySelector('[data-record-field="' + fid + '"]');
    if (!container) return;
    var maxRecords = parseInt(container.dataset.maxRecords) || 20;
    var state = recordState[fid];
    if (!state || state.total >= maxRecords) return;

    var groups = RECORD_GROUPS[fid] || [];
    var ri = state.total;
    var MAX_COLS = 3;

    // Chunk groups into rows of max MAX_COLS
    var groupRows = [];
    for (var gi = 0; gi < groups.length; gi += MAX_COLS) {
      groupRows.push(groups.slice(gi, gi + MAX_COLS));
    }

    var card = document.createElement('div');
    card.className = 'record-card';
    card.dataset.record = fid;
    card.dataset.recordIdx = String(ri);

    var rowsWrap = document.createElement('div');
    rowsWrap.className = 'record-rows';

    groupRows.forEach(function(rowGroups) {
      var gridCols = rowGroups.map(function(g) {
        if (g.width === 'narrow') return 'minmax(0,0.7fr)';
        if (g.width === 'wide') return 'minmax(0,1.5fr)';
        return 'minmax(0,1fr)';
      }).join(' ');

      var grid = document.createElement('div');
      grid.className = 'record-grid';
      grid.style.gridTemplateColumns = gridCols;

      rowGroups.forEach(function(group) {
        var col = document.createElement('div');
        col.className = 'record-group-col';
        col.innerHTML = '<div class="record-group-header">' + escHtml(group.header) + '</div>';
        group.fields.forEach(function(sf) {
          var elId = fid + '_r' + ri + '_' + group.id + '_' + sf.id;
          var html = '';
          var labelHtml = sf.label ? '<div class="record-subfield-label">' + escHtml(sf.label) + '</div>' : '';
          switch (sf.type) {
            case 'textarea':
              html = '<div class="record-subfield">' + labelHtml + '<textarea id="' + elId + '" name="' + elId + '" rows="3" placeholder="' + escHtml(sf.placeholder||'') + '"></textarea></div>';
              break;
            case 'text':
              html = '<div class="record-subfield">' + labelHtml + '<input type="text" id="' + elId + '" name="' + elId + '" placeholder="' + escHtml(sf.placeholder||'') + '" /></div>';
              break;
            case 'number':
              html = '<div class="record-subfield">' + labelHtml + '<input type="number" id="' + elId + '" name="' + elId + '" /></div>';
              break;
            case 'likert':
              var min = sf.min||0, max = sf.max||100, step = sf.step||1, suffix = escHtml(sf.suffix||'%');
              html = '<div class="record-subfield">' + labelHtml + '<div class="record-slider-wrap"><input type="range" id="' + elId + '" name="' + elId + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + min + '" data-likert="1" oninput="document.getElementById(\\'' + elId + '-val\\').textContent=this.value+\\'' + suffix + '\\'" /><span class="record-slider-val" id="' + elId + '-val">' + min + suffix + '</span></div></div>';
              break;
            case 'select':
              var optHtml = '<option value="">' + escHtml(sf.placeholder||'Select...') + '</option>';
              (sf.options||[]).forEach(function(o){optHtml+='<option value="'+escHtml(o.id)+'">'+escHtml(o.label)+'</option>';});
              html = '<div class="record-subfield">' + labelHtml + '<select id="' + elId + '" name="' + elId + '">' + optHtml + '</select></div>';
              break;
            case 'checklist':
              var cbHtml = '';
              (sf.options||[]).forEach(function(o){cbHtml+='<label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" name="'+elId+'" value="'+escHtml(o.id)+'" /> '+escHtml(o.label)+'</label>';});
              html = '<div class="record-subfield">' + labelHtml + '<div>' + cbHtml + '</div></div>';
              break;
          }
          col.insertAdjacentHTML('beforeend', html);
        });
        grid.appendChild(col);
      });
      rowsWrap.appendChild(grid);
    });

    card.appendChild(rowsWrap);

    // Insert before dots
    var dotsEl = document.getElementById(fid + '-dots');
    container.insertBefore(card, dotsEl);

    // Add dot
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'record-dot';
    dot.dataset.recordDot = fid;
    dot.dataset.dotIdx = String(ri);
    dot.onclick = function() { recordGoTo(fid, ri); };
    dotsEl.appendChild(dot);

    state.total++;
    state.current = ri;
    updateRecordUI(fid);

    // Wire up auto-save on new inputs
    card.querySelectorAll('input:not([type="range"]), textarea, select').forEach(function(el) {
      el.addEventListener('input', debouncedSave);
      el.addEventListener('change', debouncedSave);
    });
    card.querySelectorAll('input[type="range"]').forEach(function(slider) {
      slider.addEventListener('input', debouncedSave);
    });

    debouncedSave();
  };

  window.recordDelete = function(fid) {
    var container = document.querySelector('[data-record-field="' + fid + '"]');
    if (!container) return;
    var minRecords = parseInt(container.dataset.minRecords) || 1;
    var state = recordState[fid];
    if (!state || state.total <= minRecords) return;

    var cards = container.querySelectorAll('.record-card[data-record="' + fid + '"]');
    if (cards[state.current]) cards[state.current].remove();

    // Remove last dot
    var dotsEl = document.getElementById(fid + '-dots');
    var lastDot = dotsEl.querySelector('.record-dot:last-child');
    if (lastDot) lastDot.remove();

    state.total--;
    if (state.current >= state.total) state.current = state.total - 1;
    updateRecordUI(fid);
    debouncedSave();
  };

  // ── Auto-save on all inputs ──

  document.querySelectorAll('input:not([type="range"]), textarea, select').forEach(function(el) {
    el.addEventListener('input', debouncedSave);
    el.addEventListener('change', debouncedSave);
  });

  // ── Load saved data on init ──
  loadData();
})();
`
}

// ── Main export ──

export function generateInteractiveHtml(
  schema: WorksheetSchema,
  title: string,
  description?: string,
  instructions?: string,
): string {
  const storageKey = `formulate_${sanitize(title)}`
  const css = generateCss()
  const body = renderBody(schema)
  const js = generateJs(schema, storageKey)

  const descHtml = description
    ? `<p class="worksheet-description">${esc(description)}</p>`
    : ''
  const instructHtml = instructions
    ? `<div class="worksheet-instructions">${esc(instructions)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — Formulate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <header>
    <div class="container header-inner">
      <span class="logo-icon">${LOGO_SVG}</span>
      <span class="logo-text">Formulate</span>
    </div>
  </header>

  <main class="container">
    <h1 class="worksheet-title">${esc(title)}</h1>
    ${descHtml}
    ${instructHtml}
    ${body}
  </main>

  <footer>
    <div class="container">
      <div class="footer-brand">
        ${LOGO_SVG}
        <span>Powered by Formulate · formulatetools.co.uk</span>
      </div>
    </div>
  </footer>

  <div id="save-indicator" class="save-indicator">Saved</div>

  <script>${js}</script>
</body>
</html>`
}

/** Download the interactive HTML worksheet as a file */
export function downloadInteractiveHtml(
  schema: WorksheetSchema,
  title: string,
  description?: string,
  instructions?: string,
): void {
  const html = generateInteractiveHtml(schema, title, description, instructions)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitize(title)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
