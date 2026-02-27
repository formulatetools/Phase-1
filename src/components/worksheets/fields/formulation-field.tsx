'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type {
  FormulationField,
  FormulationNode,
  FormulationConnection,
  FormulationNodeField,
  FormulationLayoutPattern,
} from '@/types/worksheet'
import { getColourFromHex } from '@/lib/domain-colors'
import { useTheme } from '@/components/providers/theme-provider'

// ============================================================================
// Layout System Types
// ============================================================================

/** Visual shape of a node card */
type NodeShape = 'rect' | 'circle' | 'pill'

/** A positioned node with visual properties — returned by layout engines */
interface NodeLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  shape: NodeShape
  rotation?: number // degrees — CSS rotate transform
}

/** A pre-computed connection path — returned by layout engines */
interface ConnectionLayout {
  key: string
  d: string          // SVG path d="" attribute
  dashed: boolean
  markerStart: boolean
  markerEnd: boolean
  label?: string
  labelX?: number
  labelY?: number
}

/** Complete layout result from an engine */
interface LayoutResult {
  nodes: NodeLayout[]
  connections: ConnectionLayout[]
  totalHeight: number
}

type FieldValue = string | number | '' | string[]

interface FormulationFieldRendererProps {
  field: FormulationField
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  readOnly?: boolean
}

// ============================================================================
// Geometry Helpers
// ============================================================================

const MOBILE_BREAKPOINT = 540

/** Get point on edge of a shape closest to a target point */
function getEdgePoint(
  cx: number, cy: number, w: number, h: number, shape: NodeShape,
  tx: number, ty: number
): { x: number; y: number } {
  const angle = Math.atan2(ty - cy, tx - cx)

  if (shape === 'circle') {
    const r = Math.min(w, h) / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  // For rect/pill: intersect with bounding box
  const hw = w / 2
  const hh = h / 2
  const absCos = Math.abs(Math.cos(angle))
  const absSin = Math.abs(Math.sin(angle))

  let ex: number, ey: number
  if (hw * absSin < hh * absCos) {
    // Intersects left/right edge
    ex = cx + hw * Math.sign(Math.cos(angle))
    ey = cy + hw * Math.tan(angle) * Math.sign(Math.cos(angle))
  } else {
    // Intersects top/bottom edge
    ex = cx + hh / Math.tan(angle) * Math.sign(Math.sin(angle))
    ey = cy + hh * Math.sign(Math.sin(angle))
  }

  // Clamp for pill shapes (the rounded ends mean effective edge is inset)
  if (shape === 'pill') {
    const r = Math.min(hw, hh)
    const dist = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2)
    const maxDist = Math.sqrt(hw ** 2 + hh ** 2) - r * 0.2
    if (dist > maxDist) {
      ex = cx + (ex - cx) * maxDist / dist
      ey = cy + (ey - cy) * maxDist / dist
    }
  }

  return { x: ex, y: ey }
}

/** Build a straight-line SVG path between two nodes */
function straightPath(from: NodeLayout, to: NodeLayout): string {
  const fcx = from.x + from.width / 2
  const fcy = from.y + from.height / 2
  const tcx = to.x + to.width / 2
  const tcy = to.y + to.height / 2
  const p1 = getEdgePoint(fcx, fcy, from.width, from.height, from.shape, tcx, tcy)
  const p2 = getEdgePoint(tcx, tcy, to.width, to.height, to.shape, fcx, fcy)
  return `M${p1.x},${p1.y} L${p2.x},${p2.y}`
}

/** Build a curved SVG path (quadratic bezier) between two nodes, bowing outward */
function curvedPath(from: NodeLayout, to: NodeLayout, curvature = 0.3): string {
  const fcx = from.x + from.width / 2
  const fcy = from.y + from.height / 2
  const tcx = to.x + to.width / 2
  const tcy = to.y + to.height / 2
  const p1 = getEdgePoint(fcx, fcy, from.width, from.height, from.shape, tcx, tcy)
  const p2 = getEdgePoint(tcx, tcy, to.width, to.height, to.shape, fcx, fcy)

  // Control point: perpendicular to midpoint, offset by curvature
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nx = -dy / dist
  const ny = dx / dist
  const cpx = mx + nx * dist * curvature
  const cpy = my + ny * dist * curvature

  return `M${p1.x},${p1.y} Q${cpx},${cpy} ${p2.x},${p2.y}`
}

/** Convert schema connections into ConnectionLayout[] using node positions */
function buildConnections(
  connections: FormulationConnection[],
  nodeMap: Map<string, NodeLayout>,
  pathStyle: 'straight' | 'curved' = 'straight'
): ConnectionLayout[] {
  return connections.map((conn, i) => {
    const from = nodeMap.get(conn.from)
    const to = nodeMap.get(conn.to)
    if (!from || !to) return null

    const d = pathStyle === 'curved' ? curvedPath(from, to) : straightPath(from, to)
    const isDashed = conn.style === 'arrow_dashed' || conn.style === 'line_dashed'
    const hasArrow = conn.style === 'arrow' || conn.style === 'arrow_dashed' || conn.style === 'inhibitory'

    // Label at midpoint of path
    const fcx = from.x + from.width / 2
    const fcy = from.y + from.height / 2
    const tcx = to.x + to.width / 2
    const tcy = to.y + to.height / 2

    return {
      key: `${conn.from}-${conn.to}-${i}`,
      d,
      dashed: isDashed,
      markerStart: hasArrow && conn.direction === 'both',
      markerEnd: hasArrow,
      label: conn.label,
      labelX: (fcx + tcx) / 2,
      labelY: (fcy + tcy) / 2 - 8,
    }
  }).filter(Boolean) as ConnectionLayout[]
}

// ============================================================================
// Layout Engine: Cross-Sectional (Diamond)
// ============================================================================

function layoutCrossSectional(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  const nodesBySlot: Record<string, FormulationNode> = {}
  for (const n of nodes) nodesBySlot[n.slot] = n

  const nodeW = Math.min(160, containerWidth * 0.24)
  const nodeH = 120
  const cx = containerWidth / 2

  // Trigger sits above the diamond
  const triggerW = Math.min(220, containerWidth * 0.45)
  const triggerH = 90

  const diamondRadius = Math.min(150, containerWidth * 0.26)
  // Gap must be > nodeH/2 so diamond north doesn't overlap trigger
  const gapBelowTrigger = nodeH / 2 + 30
  const diamondCy = triggerH + gapBelowTrigger + diamondRadius

  const layouts: NodeLayout[] = []

  // Trigger — top centre, rectangle
  if (nodesBySlot['top']) {
    layouts.push({
      id: nodesBySlot['top'].id,
      x: cx - triggerW / 2, y: 0,
      width: triggerW, height: triggerH,
      shape: 'rect',
    })
  }

  // Diamond: 4 nodes at N/W/E/S positions
  const diamondSlots: [string, number, number][] = [
    ['left',   cx - diamondRadius - nodeW / 2, diamondCy - nodeH / 2],    // West
    ['centre', cx - nodeW / 2,                 diamondCy - diamondRadius - nodeH / 2], // North
    ['right',  cx + diamondRadius - nodeW / 2, diamondCy - nodeH / 2],    // East
    ['bottom', cx - nodeW / 2,                 diamondCy + diamondRadius - nodeH / 2], // South
  ]

  for (const [slot, x, y] of diamondSlots) {
    const node = nodesBySlot[slot]
    if (node) {
      layouts.push({ id: node.id, x, y, width: nodeW, height: nodeH, shape: 'rect' })
    }
  }

  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = layouts.reduce((max, n) => Math.max(max, n.y + n.height), 0) + 20
  const conns = buildConnections(connections, nodeMap, 'straight')

  return { nodes: layouts, connections: conns, totalHeight }
}

// ============================================================================
// Layout Engine: Radial / Flower
// ============================================================================

function layoutRadial(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  const centre = nodes.find(n => n.slot === 'centre')
  const petals = nodes.filter(n => n.slot !== 'centre')

  const centreSize = Math.min(210, containerWidth * 0.34)
  const petalW = Math.min(150, containerWidth * 0.24)
  const petalH = 110
  const radius = centreSize / 2 + Math.max(petalW, petalH) / 2 + 50
  const cx = containerWidth / 2
  const cy = radius + centreSize / 2 + 10

  const layouts: NodeLayout[] = []

  // Centre — circle
  if (centre) {
    layouts.push({
      id: centre.id,
      x: cx - centreSize / 2, y: cy - centreSize / 2,
      width: centreSize, height: centreSize,
      shape: 'circle',
    })
  }

  // Petals — pills arranged in a circle, rotated to face outward
  const angleStep = (2 * Math.PI) / petals.length
  const startAngle = -Math.PI / 2

  for (let i = 0; i < petals.length; i++) {
    const angle = startAngle + i * angleStep
    const px = cx + radius * Math.cos(angle) - petalW / 2
    const py = cy + radius * Math.sin(angle) - petalH / 2
    const rotDeg = (angle * 180) / Math.PI + 90 // rotate so long axis points away from centre

    layouts.push({
      id: petals[i].id,
      x: px, y: py,
      width: petalW, height: petalH,
      shape: 'pill',
      // Don't visually rotate the card content — it would make text unreadable
      // rotation: rotDeg, // (disabled — content must stay horizontal)
    })
  }

  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = layouts.reduce((max, n) => Math.max(max, n.y + n.height), 0) + 20
  const conns = buildConnections(connections, nodeMap, 'curved')

  return { nodes: layouts, connections: conns, totalHeight }
}

// ============================================================================
// Layout Engine: Fallback (vertical stack)
// ============================================================================

function layoutFallback(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  let y = 0
  const layouts: NodeLayout[] = nodes.map(n => {
    const nl: NodeLayout = { id: n.id, x: 0, y, width: containerWidth, height: 140, shape: 'rect' }
    y += 152
    return nl
  })
  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = y + 8
  const conns = buildConnections(connections, nodeMap, 'straight')
  return { nodes: layouts, connections: conns, totalHeight }
}

/** Main dispatcher */
function computeLayout(
  layout: FormulationLayoutPattern | string,
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  switch (layout) {
    case 'cross_sectional':
      return layoutCrossSectional(nodes, connections, containerWidth)
    case 'radial':
      return layoutRadial(nodes, connections, containerWidth)
    default:
      return layoutFallback(nodes, connections, containerWidth)
  }
}

// ============================================================================
// SVG Connection Renderer
// ============================================================================

function ConnectionsSVG({
  connections,
  totalHeight,
  totalWidth,
  isDark,
}: {
  connections: ConnectionLayout[]
  totalHeight: number
  totalWidth: number
  isDark: boolean
}) {
  const stroke = isDark ? '#6b7280' : '#94a3b8'

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker id="fml-ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={stroke} />
        </marker>
        <marker id="fml-ah-r" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
          <polygon points="8 0, 0 3, 8 6" fill={stroke} />
        </marker>
      </defs>

      {connections.map(conn => (
        <g key={conn.key}>
          <path
            d={conn.d}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeDasharray={conn.dashed ? '6 4' : undefined}
            markerEnd={conn.markerEnd ? 'url(#fml-ah)' : undefined}
            markerStart={conn.markerStart ? 'url(#fml-ah-r)' : undefined}
          />
          {conn.label && conn.labelX != null && conn.labelY != null && (
            <text
              x={conn.labelX} y={conn.labelY}
              textAnchor="middle"
              fill={isDark ? '#9ca3af' : '#94a3b8'}
              className="text-[10px] italic"
            >
              {conn.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ============================================================================
// Mobile Flow Arrow
// ============================================================================

function MobileFlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <svg className="h-4 w-4 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
      </svg>
    </div>
  )
}

// ============================================================================
// Node Field Renderer (simple fields inside nodes)
// ============================================================================

function NodeFieldRenderer({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormulationNodeField
  value: FieldValue
  onChange: (value: FieldValue) => void
  readOnly?: boolean
}) {
  const baseInputClass =
    'w-full rounded-lg border border-primary-200/50 bg-surface/80 px-2 py-1.5 text-sm text-foreground placeholder-primary-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30'

  if (readOnly) {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '')
    return (
      <div className="space-y-0.5">
        {field.label && (
          <p className="text-[10px] font-medium text-primary-500">{field.label}</p>
        )}
        {displayValue ? (
          <p className="text-sm text-foreground">{displayValue}</p>
        ) : (
          <p className="text-sm italic text-primary-400">Not answered</p>
        )}
      </div>
    )
  }

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-0.5">
          {field.label && <label className="text-[10px] font-medium text-primary-500">{field.label}</label>}
          <input
            type="text"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        </div>
      )
    case 'textarea':
      return (
        <div className="space-y-0.5">
          {field.label && <label className="text-[10px] font-medium text-primary-500">{field.label}</label>}
          <textarea
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={2}
            className={`${baseInputClass} resize-none`}
          />
        </div>
      )
    case 'number':
      return (
        <div className="space-y-0.5">
          {field.label && <label className="text-[10px] font-medium text-primary-500">{field.label}</label>}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={value === '' || value === undefined ? '' : Number(value)}
              onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              className={`${baseInputClass} w-24`}
            />
            {field.suffix && <span className="text-xs text-primary-400">{field.suffix}</span>}
          </div>
        </div>
      )
    case 'likert': {
      const min = field.min ?? 0
      const max = field.max ?? 10
      const current = typeof value === 'number' ? value : min
      return (
        <div className="space-y-0.5">
          {field.label && <label className="text-[10px] font-medium text-primary-500">{field.label}</label>}
          <input
            type="range"
            min={min}
            max={max}
            step={field.step ?? 1}
            value={current}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-primary-400">
            <span>{field.anchors?.[String(min)] || min}</span>
            <span className="font-medium text-primary-600">{current}</span>
            <span>{field.anchors?.[String(max)] || max}</span>
          </div>
        </div>
      )
    }
    case 'checklist':
      return (
        <div className="space-y-1">
          {field.label && <label className="text-[10px] font-medium text-primary-500">{field.label}</label>}
          {field.options?.map(opt => {
            const checked = Array.isArray(value) && value.includes(opt.id)
            return (
              <label key={opt.id} className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => {
                    const current = Array.isArray(value) ? value : []
                    onChange(e.target.checked ? [...current, opt.id] : current.filter(v => v !== opt.id))
                  }}
                  className="h-4 w-4 rounded border-primary-300"
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      )
    case 'select':
      return (
        <div className="space-y-0.5">
          {field.label && <label className="text-[10px] font-medium text-primary-500">{field.label}</label>}
          <select
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={baseInputClass}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    default:
      return null
  }
}

// ============================================================================
// Shape class mapping
// ============================================================================

const SHAPE_CLASSES: Record<NodeShape, string> = {
  rect: 'rounded-xl',
  circle: 'rounded-full',
  pill: 'rounded-full',   // on non-square elements, rounded-full → pill shape
}

// ============================================================================
// Node Card (shape-aware)
// ============================================================================

function FormulationNodeCard({
  node,
  layout,
  nodeValues,
  onFieldChange,
  readOnly,
  isDark,
}: {
  node: FormulationNode
  layout: NodeLayout
  nodeValues: Record<string, FieldValue>
  onFieldChange: (fieldId: string, value: FieldValue) => void
  readOnly?: boolean
  isDark: boolean
}) {
  const colours = getColourFromHex(node.domain_colour, isDark)
  const shapeClass = SHAPE_CLASSES[layout.shape]

  // Circle nodes need more internal padding to keep content in the inscribed rectangle
  const isCircle = layout.shape === 'circle'
  const paddingClass = isCircle ? 'p-5' : layout.shape === 'pill' ? 'px-5 py-3' : 'p-3'

  return (
    <div
      className={`absolute border-2 transition-shadow hover:shadow-md overflow-hidden ${shapeClass} ${paddingClass}`}
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        minHeight: layout.height,
        borderColor: colours.border,
        backgroundColor: colours.bg,
        ...(layout.rotation ? { transform: `rotate(${layout.rotation}deg)` } : {}),
        // Circle: centre content with flexbox
        ...(isCircle ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
      }}
    >
      {/* If card is rotated, counter-rotate content so text stays readable */}
      <div
        className={isCircle ? 'text-center w-full' : undefined}
        style={layout.rotation ? { transform: `rotate(${-layout.rotation}deg)` } : undefined}
      >
        <p
          className="mb-1 text-[0.6rem] font-semibold uppercase tracking-wider"
          style={{ color: colours.text }}
        >
          {node.label}
        </p>
        {node.description && (
          <p className="mb-1.5 text-[10px] text-primary-400 leading-tight">{node.description}</p>
        )}
        <div className="space-y-2">
          {node.fields.map(field => (
            <NodeFieldRenderer
              key={field.id}
              field={field}
              value={nodeValues[field.id] ?? ''}
              onChange={val => onFieldChange(field.id, val)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Mobile Stacked Layout
// ============================================================================

function MobileStackedLayout({
  nodes,
  connections,
  layout,
  nodeValues,
  onFieldChange,
  readOnly,
  isDark,
}: {
  nodes: FormulationNode[]
  connections: FormulationConnection[]
  layout: string
  nodeValues: Record<string, Record<string, FieldValue>>
  onFieldChange: (nodeId: string, fieldId: string, value: FieldValue) => void
  readOnly?: boolean
  isDark: boolean
}) {
  // Determine node order
  let orderedNodes: FormulationNode[]
  if (layout === 'cross_sectional') {
    const slotOrder = ['top', 'left', 'centre', 'right', 'bottom']
    const bySlot: Record<string, FormulationNode> = {}
    for (const n of nodes) bySlot[n.slot] = n
    orderedNodes = slotOrder.map(s => bySlot[s]).filter(Boolean)
  } else if (layout === 'radial') {
    const centre = nodes.find(n => n.slot === 'centre')
    const petals = nodes.filter(n => n.slot !== 'centre')
    orderedNodes = centre ? [centre, ...petals] : petals
  } else {
    orderedNodes = nodes
  }

  return (
    <div className="space-y-0">
      {orderedNodes.map((node, i) => {
        const colours = getColourFromHex(node.domain_colour, isDark)
        const showArrow = i < orderedNodes.length - 1
        // Softer rounding for radial centre node on mobile (not full circle — too wide)
        const isRadialCentre = layout === 'radial' && node.slot === 'centre'
        const shapeClass = isRadialCentre ? 'rounded-3xl' : 'rounded-xl'

        return (
          <div key={node.id}>
            <div
              className={`border-2 p-3 ${shapeClass}`}
              style={{
                borderColor: colours.border,
                backgroundColor: colours.bg,
              }}
            >
              <p
                className="mb-1 text-[0.6rem] font-semibold uppercase tracking-wider"
                style={{ color: colours.text }}
              >
                {node.label}
              </p>
              {node.description && (
                <p className="mb-2 text-[10px] text-primary-400">{node.description}</p>
              )}
              <div className="space-y-2">
                {node.fields.map(field => (
                  <NodeFieldRenderer
                    key={field.id}
                    field={field}
                    value={nodeValues[node.id]?.[field.id] ?? ''}
                    onChange={val => onFieldChange(node.id, field.id, val)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
            {showArrow && <MobileFlowArrow />}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Desktop Diagram Layout
// ============================================================================

function DesktopDiagramLayout({
  layoutResult,
  nodes,
  nodeValues,
  onFieldChange,
  readOnly,
  isDark,
  containerWidth,
}: {
  layoutResult: LayoutResult
  nodes: FormulationNode[]
  nodeValues: Record<string, Record<string, FieldValue>>
  onFieldChange: (nodeId: string, fieldId: string, value: FieldValue) => void
  readOnly?: boolean
  isDark: boolean
  containerWidth: number
}) {
  const nodeLayoutMap = new Map(layoutResult.nodes.map(n => [n.id, n]))

  return (
    <div className="relative" style={{ minHeight: layoutResult.totalHeight }}>
      <ConnectionsSVG
        connections={layoutResult.connections}
        totalHeight={layoutResult.totalHeight}
        totalWidth={containerWidth}
        isDark={isDark}
      />

      {nodes.map(node => {
        const nl = nodeLayoutMap.get(node.id)
        if (!nl) return null

        return (
          <FormulationNodeCard
            key={node.id}
            node={node}
            layout={nl}
            nodeValues={nodeValues[node.id] || {}}
            onFieldChange={(fieldId, value) =>
              onFieldChange(node.id, fieldId, value)
            }
            readOnly={readOnly}
            isDark={isDark}
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Renderer
// ============================================================================

export function FormulationFieldRenderer({
  field,
  values,
  onChange,
  readOnly,
}: FormulationFieldRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const nodes = field.nodes || []
  const connections = field.connections || []
  const config = field.formulation_config
  const isMobile = containerWidth < MOBILE_BREAKPOINT

  const nodeValues = (values?.nodes || {}) as Record<string, Record<string, FieldValue>>

  const handleFieldChange = useCallback(
    (nodeId: string, fieldId: string, value: FieldValue) => {
      const currentNodes = (values?.nodes || {}) as Record<string, Record<string, FieldValue>>
      const updatedNodes = {
        ...currentNodes,
        [nodeId]: {
          ...(currentNodes[nodeId] || {}),
          [fieldId]: value,
        },
      }
      onChange({ ...values, nodes: updatedNodes })
    },
    [values, onChange]
  )

  // Compute layout (only used for desktop, but always computed for width measurement)
  const layoutResult = computeLayout(field.layout, nodes, connections, containerWidth)

  return (
    <div className="space-y-2" ref={containerRef}>
      {config?.show_title && config.title && (
        <h3 className="text-center text-sm font-semibold text-primary-700">
          {config.title}
        </h3>
      )}

      {isMobile ? (
        <MobileStackedLayout
          nodes={nodes}
          connections={connections}
          layout={field.layout}
          nodeValues={nodeValues}
          onFieldChange={handleFieldChange}
          readOnly={readOnly}
          isDark={isDark}
        />
      ) : (
        <DesktopDiagramLayout
          layoutResult={layoutResult}
          nodes={nodes}
          containerWidth={containerWidth}
          nodeValues={nodeValues}
          onFieldChange={handleFieldChange}
          readOnly={readOnly}
          isDark={isDark}
        />
      )}
    </div>
  )
}
