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
import { AutoTextarea } from '@/components/ui/auto-textarea'
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
  colour?: string    // domain hex colour for this connection (from source node)
}

/** Petal backdrop shape data — drawn as decorative SVG behind node cards */
interface PetalBackdrop {
  nodeId: string
  d: string          // SVG path for the petal/teardrop shape
  fillColour: string // domain hex colour
}

/** Centre ring data for the flower centre decoration */
interface CentreRing {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  colour: string     // domain hex colour of centre node
}

/** Complete layout result from an engine */
interface LayoutResult {
  nodes: NodeLayout[]
  connections: ConnectionLayout[]
  totalHeight: number
  petalBackdrops?: PetalBackdrop[]
  centreRing?: CentreRing
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
  pathStyle: 'straight' | 'curved' = 'straight',
  schemaNodes?: FormulationNode[]
): ConnectionLayout[] {
  // Build a colour lookup from schema nodes (for domain-coloured connections)
  const colourMap = new Map<string, string>()
  if (schemaNodes) {
    for (const n of schemaNodes) colourMap.set(n.id, n.domain_colour)
  }

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

    // Use source node's domain colour for the connection
    const colour = colourMap.get(conn.from) || colourMap.get(conn.to)

    return {
      key: `${conn.from}-${conn.to}-${i}`,
      d,
      dashed: isDashed,
      markerStart: hasArrow && conn.direction === 'both',
      markerEnd: hasArrow,
      label: conn.label,
      labelX: (fcx + tcx) / 2,
      labelY: (fcy + tcy) / 2 - 8,
      colour,
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
  const conns = buildConnections(connections, nodeMap, 'straight', nodes)

  return { nodes: layouts, connections: conns, totalHeight }
}

// ============================================================================
// Layout Engine: Radial / Flower
// ============================================================================

/**
 * Generate an SVG path for a decorative petal/teardrop shape.
 * The petal starts at the centre edge and extends outward toward the petal node.
 */
function generatePetalPath(
  flowerCx: number, flowerCy: number,
  angle: number,
  innerRadius: number,  // start distance from centre
  outerRadius: number,  // end distance (at/past the node)
  petalWidth: number    // width at the widest point
): string {
  // Base point (near centre)
  const bx = flowerCx + innerRadius * Math.cos(angle)
  const by = flowerCy + innerRadius * Math.sin(angle)
  // Tip point (outer end of petal)
  const tx = flowerCx + outerRadius * Math.cos(angle)
  const ty = flowerCy + outerRadius * Math.sin(angle)

  // Perpendicular direction for width
  const perpAngle = angle + Math.PI / 2
  const halfW = petalWidth / 2

  // Control points for cubic bezier curves (create a leaf/teardrop shape)
  // Left side: base → widest point → tip
  const midDist = (innerRadius + outerRadius) / 2
  const cp1x = flowerCx + midDist * 0.8 * Math.cos(angle) + halfW * Math.cos(perpAngle)
  const cp1y = flowerCy + midDist * 0.8 * Math.sin(angle) + halfW * Math.sin(perpAngle)
  const cp2x = flowerCx + midDist * 1.2 * Math.cos(angle) + halfW * 0.6 * Math.cos(perpAngle)
  const cp2y = flowerCy + midDist * 1.2 * Math.sin(angle) + halfW * 0.6 * Math.sin(perpAngle)

  // Right side: tip → widest point → base (mirror)
  const cp3x = flowerCx + midDist * 1.2 * Math.cos(angle) - halfW * 0.6 * Math.cos(perpAngle)
  const cp3y = flowerCy + midDist * 1.2 * Math.sin(angle) - halfW * 0.6 * Math.sin(perpAngle)
  const cp4x = flowerCx + midDist * 0.8 * Math.cos(angle) - halfW * Math.cos(perpAngle)
  const cp4y = flowerCy + midDist * 0.8 * Math.sin(angle) - halfW * Math.sin(perpAngle)

  return [
    `M${bx},${by}`,
    `C${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`,
    `C${cp3x},${cp3y} ${cp4x},${cp4y} ${bx},${by}`,
    'Z',
  ].join(' ')
}

function layoutRadial(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  const centre = nodes.find(n => n.slot === 'centre')
  const petals = nodes.filter(n => n.slot !== 'centre')

  const centreSize = Math.min(210, containerWidth * 0.34)
  const petalW = Math.min(185, containerWidth * 0.27)
  const petalH = 130
  const radius = centreSize / 2 + Math.max(petalW, petalH) / 2 + 45
  const cx = containerWidth / 2
  const cy = radius + centreSize / 2 + 10

  const layouts: NodeLayout[] = []
  const petalBackdrops: PetalBackdrop[] = []

  // Centre — circle
  if (centre) {
    layouts.push({
      id: centre.id,
      x: cx - centreSize / 2, y: cy - centreSize / 2,
      width: centreSize, height: centreSize,
      shape: 'circle',
    })
  }

  // Petals — pills arranged in a circle
  const angleStep = (2 * Math.PI) / petals.length
  const startAngle = -Math.PI / 2

  for (let i = 0; i < petals.length; i++) {
    const angle = startAngle + i * angleStep
    const px = cx + radius * Math.cos(angle) - petalW / 2
    const py = cy + radius * Math.sin(angle) - petalH / 2

    layouts.push({
      id: petals[i].id,
      x: px, y: py,
      width: petalW, height: petalH,
      shape: 'pill',
    })

    // Generate decorative petal backdrop behind this node card
    const petalInnerR = centreSize / 2 + 8 // start just outside the centre circle
    const petalOuterR = radius + Math.max(petalW, petalH) / 2 + 8 // extend past the node
    const petalBackdropWidth = Math.max(petalW, petalH) * 0.7

    petalBackdrops.push({
      nodeId: petals[i].id,
      d: generatePetalPath(cx, cy, angle, petalInnerR, petalOuterR, petalBackdropWidth),
      fillColour: petals[i].domain_colour,
    })
  }

  // Centre ring decoration
  const centreRing: CentreRing | undefined = centre ? {
    cx, cy,
    innerRadius: centreSize / 2,
    outerRadius: centreSize / 2 + 12,
    colour: centre.domain_colour,
  } : undefined

  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = layouts.reduce((max, n) => Math.max(max, n.y + n.height), 0) + 20
  const conns = buildConnections(connections, nodeMap, 'curved', nodes)

  return { nodes: layouts, connections: conns, totalHeight, petalBackdrops, centreRing }
}

// ============================================================================
// Layout Engine: Vertical Flow (Longitudinal / Developmental)
// ============================================================================

function layoutVerticalFlow(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  const steps = nodes
    .filter(n => n.slot.startsWith('step-'))
    .sort((a, b) => parseInt(a.slot.split('-')[1]) - parseInt(b.slot.split('-')[1]))
  const gridNodes = nodes
    .filter(n => n.slot.startsWith('grid-'))
    .sort((a, b) => parseInt(a.slot.split('-')[1]) - parseInt(b.slot.split('-')[1]))

  const stepW = Math.min(340, containerWidth * 0.65)
  const stepH = 110
  const gap = 50 // vertical gap between steps (room for arrow)
  const cx = containerWidth / 2
  const layouts: NodeLayout[] = []
  let y = 0

  // Sequential steps — centred, generous width
  for (const step of steps) {
    layouts.push({
      id: step.id,
      x: cx - stepW / 2,
      y,
      width: stepW,
      height: stepH,
      shape: 'rect',
    })
    y += stepH + gap
  }

  // Optional 2×2 sub-grid at the bottom
  if (gridNodes.length > 0) {
    const gridW = Math.min(155, containerWidth * 0.28)
    const gridH = 100
    const gridGap = 16
    const gridTotalW = gridW * 2 + gridGap
    const gridStartX = cx - gridTotalW / 2

    for (let i = 0; i < gridNodes.length && i < 4; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      layouts.push({
        id: gridNodes[i].id,
        x: gridStartX + col * (gridW + gridGap),
        y: y + row * (gridH + gridGap),
        width: gridW,
        height: gridH,
        shape: 'rect',
      })
    }
    y += Math.ceil(Math.min(gridNodes.length, 4) / 2) * (gridH + gridGap)
  }

  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const totalHeight = y + 10
  const conns = buildConnections(connections, nodeMap, 'straight', nodes)

  return { nodes: layouts, connections: conns, totalHeight }
}

// ============================================================================
// Layout Engine: Cycle (Maintenance Loop)
// ============================================================================

function layoutCycle(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  const sorted = [...nodes].sort((a, b) => {
    const ai = parseInt(a.slot.replace('cycle-', ''))
    const bi = parseInt(b.slot.replace('cycle-', ''))
    return ai - bi
  })

  const n = sorted.length
  const nodeW = Math.min(170, containerWidth * 0.28)
  const nodeH = 120
  const cx = containerWidth / 2

  // Radius scales with node count and container width
  const radius = Math.min(150 + n * 10, containerWidth * 0.32)
  const cy = radius + nodeH / 2 + 10

  const layouts: NodeLayout[] = []

  // Place nodes in a circle, starting from top (−π/2), clockwise
  const startAngle = -Math.PI / 2
  const angleStep = (2 * Math.PI) / n

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    layouts.push({
      id: sorted[i].id,
      x: cx + radius * Math.cos(angle) - nodeW / 2,
      y: cy + radius * Math.sin(angle) - nodeH / 2,
      width: nodeW,
      height: nodeH,
      shape: 'rect',
    })
  }

  const nodeMap = new Map(layouts.map(nl => [nl.id, nl]))
  const totalHeight = layouts.reduce((max, nl) => Math.max(max, nl.y + nl.height), 0) + 20
  const conns = buildConnections(connections, nodeMap, 'curved', nodes)

  return { nodes: layouts, connections: conns, totalHeight }
}

// ============================================================================
// Layout Engine: Three Systems (Triangle)
// ============================================================================

function layoutThreeSystems(
  nodes: FormulationNode[],
  connections: FormulationConnection[],
  containerWidth: number
): LayoutResult {
  const bySlot: Record<string, FormulationNode> = {}
  for (const n of nodes) bySlot[n.slot] = n

  const nodeW = Math.min(180, containerWidth * 0.3)
  const nodeH = 130
  const cx = containerWidth / 2

  // Triangle geometry — apex at top, base at bottom
  const topY = 10
  const bottomY = topY + Math.min(260, containerWidth * 0.42)
  const spread = Math.min(containerWidth * 0.34, 210)

  const layouts: NodeLayout[] = []

  // Apex — top centre
  if (bySlot['system-0']) {
    layouts.push({
      id: bySlot['system-0'].id,
      x: cx - nodeW / 2,
      y: topY,
      width: nodeW,
      height: nodeH,
      shape: 'rect',
    })
  }

  // Bottom-left
  if (bySlot['system-1']) {
    layouts.push({
      id: bySlot['system-1'].id,
      x: cx - spread - nodeW / 2,
      y: bottomY,
      width: nodeW,
      height: nodeH,
      shape: 'rect',
    })
  }

  // Bottom-right
  if (bySlot['system-2']) {
    layouts.push({
      id: bySlot['system-2'].id,
      x: cx + spread - nodeW / 2,
      y: bottomY,
      width: nodeW,
      height: nodeH,
      shape: 'rect',
    })
  }

  // Optional centre node (e.g. "self" in CFT)
  if (bySlot['centre']) {
    const centreSize = Math.min(130, containerWidth * 0.22)
    const centreY = topY + (bottomY - topY) * 0.55
    layouts.push({
      id: bySlot['centre'].id,
      x: cx - centreSize / 2,
      y: centreY - centreSize / 2,
      width: centreSize,
      height: centreSize,
      shape: 'circle',
    })
  }

  const nodeMap = new Map(layouts.map(nl => [nl.id, nl]))
  const totalHeight = layouts.reduce((max, nl) => Math.max(max, nl.y + nl.height), 0) + 20
  const conns = buildConnections(connections, nodeMap, 'straight', nodes)

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
    case 'vertical_flow':
      return layoutVerticalFlow(nodes, connections, containerWidth)
    case 'cycle':
      return layoutCycle(nodes, connections, containerWidth)
    case 'three_systems':
      return layoutThreeSystems(nodes, connections, containerWidth)
    default:
      return layoutFallback(nodes, connections, containerWidth)
  }
}

// ============================================================================
// SVG Connection Renderer
// ============================================================================

function ConnectionsSVG({
  connections,
  petalBackdrops,
  centreRing,
  totalHeight,
  totalWidth,
  isDark,
}: {
  connections: ConnectionLayout[]
  petalBackdrops?: PetalBackdrop[]
  centreRing?: CentreRing
  totalHeight: number
  totalWidth: number
  isDark: boolean
}) {
  const defaultStroke = isDark ? '#6b7280' : '#94a3b8'
  // Unique set of colours used by connections (for per-colour marker defs)
  const uniqueColours = new Set<string>()
  for (const c of connections) {
    if (c.colour) uniqueColours.add(c.colour)
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Default grey markers */}
        <marker id="fml-ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={defaultStroke} />
        </marker>
        <marker id="fml-ah-r" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
          <polygon points="8 0, 0 3, 8 6" fill={defaultStroke} />
        </marker>
        {/* Per-colour markers for domain-coloured connections */}
        {[...uniqueColours].map(hex => {
          const id = hex.replace('#', '')
          const markerColour = isDark ? `${hex}99` : `${hex}aa`
          return (
            <g key={hex}>
              <marker id={`fml-ah-${id}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={markerColour} />
              </marker>
              <marker id={`fml-ah-r-${id}`} markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
                <polygon points="8 0, 0 3, 8 6" fill={markerColour} />
              </marker>
            </g>
          )
        })}
      </defs>

      {/* Decorative petal backdrops — behind everything */}
      {petalBackdrops?.map(petal => (
        <path
          key={`petal-bg-${petal.nodeId}`}
          d={petal.d}
          fill={isDark ? `${petal.fillColour}12` : `${petal.fillColour}18`}
          stroke={isDark ? `${petal.fillColour}20` : `${petal.fillColour}30`}
          strokeWidth={1}
        />
      ))}

      {/* Centre ring decoration */}
      {centreRing && (
        <g>
          <circle
            cx={centreRing.cx} cy={centreRing.cy}
            r={centreRing.outerRadius}
            fill="none"
            stroke={isDark ? `${centreRing.colour}25` : `${centreRing.colour}30`}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        </g>
      )}

      {/* Connection paths */}
      {connections.map(conn => {
        const connColour = conn.colour
        const stroke = connColour
          ? (isDark ? `${connColour}80` : `${connColour}90`)
          : defaultStroke
        const hexId = connColour?.replace('#', '')
        const markerEndId = connColour ? `fml-ah-${hexId}` : 'fml-ah'
        const markerStartId = connColour ? `fml-ah-r-${hexId}` : 'fml-ah-r'

        return (
          <g key={conn.key}>
            <path
              d={conn.d}
              fill="none"
              stroke={stroke}
              strokeWidth={connColour ? 2 : 1.5}
              strokeDasharray={conn.dashed ? '6 4' : undefined}
              markerEnd={conn.markerEnd ? `url(#${markerEndId})` : undefined}
              markerStart={conn.markerStart ? `url(#${markerStartId})` : undefined}
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
        )
      })}
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

/** Curved "loops back" arrow shown at the end of cycle patterns on mobile */
function MobileCycleLoopbackArrow({ firstNodeLabel }: { firstNodeLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      <svg className="h-6 w-10 text-primary-300" fill="none" viewBox="0 0 40 24" strokeWidth={1.5} stroke="currentColor">
        {/* Curved arrow looping back up */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 2 C20 12, 36 12, 36 18 M36 18 C36 24, 4 24, 4 18 M4 18 C4 12, 20 12, 20 2"
          strokeDasharray="4 3"
        />
        {/* Arrowhead at top */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 6 L20 2 L24 6" />
      </svg>
      <span className="text-[9px] italic text-primary-400">
        loops back to {firstNodeLabel}
      </span>
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
          <p className="whitespace-pre-wrap text-sm text-foreground">{displayValue}</p>
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
          <AutoTextarea
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            minRows={2}
            className={baseInputClass}
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
  pill: 'rounded-[2.5rem]',  // generous rounding without full ellipse clipping
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
  const paddingClass = isCircle ? 'p-5' : layout.shape === 'pill' ? 'px-6 py-3' : 'p-3'

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
  // Determine node order for mobile stacked view
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
  } else if (layout === 'vertical_flow') {
    const steps = nodes
      .filter(n => n.slot.startsWith('step-'))
      .sort((a, b) => parseInt(a.slot.split('-')[1]) - parseInt(b.slot.split('-')[1]))
    const gridNodes = nodes
      .filter(n => n.slot.startsWith('grid-'))
      .sort((a, b) => parseInt(a.slot.split('-')[1]) - parseInt(b.slot.split('-')[1]))
    orderedNodes = [...steps, ...gridNodes]
  } else if (layout === 'cycle') {
    orderedNodes = [...nodes].sort((a, b) => {
      const ai = parseInt(a.slot.replace('cycle-', ''))
      const bi = parseInt(b.slot.replace('cycle-', ''))
      return ai - bi
    })
  } else if (layout === 'three_systems') {
    const slotOrder = ['system-0', 'system-1', 'system-2', 'centre']
    const bySlot: Record<string, FormulationNode> = {}
    for (const n of nodes) bySlot[n.slot] = n
    orderedNodes = slotOrder.map(s => bySlot[s]).filter(Boolean)
  } else {
    orderedNodes = nodes
  }

  return (
    <div className="space-y-0">
      {orderedNodes.map((node, i) => {
        const colours = getColourFromHex(node.domain_colour, isDark)
        const showArrow = i < orderedNodes.length - 1
        // Softer rounding for radial centre node on mobile (not full circle — too wide)
        const isRoundedCentre = (layout === 'radial' || layout === 'three_systems') && node.slot === 'centre'
        const shapeClass = isRoundedCentre ? 'rounded-3xl' : 'rounded-xl'

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
            {/* Cycle: show "loops back" arrow after last node */}
            {!showArrow && layout === 'cycle' && orderedNodes.length >= 3 && i === orderedNodes.length - 1 && (
              <MobileCycleLoopbackArrow firstNodeLabel={orderedNodes[0].label} />
            )}
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
        petalBackdrops={layoutResult.petalBackdrops}
        centreRing={layoutResult.centreRing}
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
  const [viewOverride, setViewOverride] = useState<'auto' | 'diagram' | 'list'>('auto')
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
  const autoIsMobile = containerWidth < MOBILE_BREAKPOINT

  // View mode: 'auto' uses screen width, 'diagram'/'list' are explicit overrides
  const showDiagram = viewOverride === 'diagram' || (viewOverride === 'auto' && !autoIsMobile)
  const showList = viewOverride === 'list' || (viewOverride === 'auto' && autoIsMobile)

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

  // Always compute diagram layout (needed for print, and cheap to compute)
  const layoutResult = computeLayout(field.layout, nodes, connections, containerWidth)

  return (
    <div className="space-y-2" ref={containerRef} data-formulation-layout={field.layout}>
      {config?.show_title && config.title && (
        <h3 className="text-center text-sm font-semibold text-primary-700">
          {config.title}
        </h3>
      )}

      {/* View toggle — diagram ↔ list */}
      {nodes.length > 0 && (
        <div className="no-print flex justify-end gap-1">
          {(['diagram', 'list'] as const).map(mode => {
            const isActive = viewOverride === mode || (viewOverride === 'auto' && ((mode === 'diagram' && !autoIsMobile) || (mode === 'list' && autoIsMobile)))
            return (
              <button
                key={mode}
                onClick={() => setViewOverride(mode === viewOverride ? 'auto' : mode)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-200 text-primary-700'
                    : 'text-primary-400 hover:bg-primary-100 hover:text-primary-600'
                }`}
                title={mode === 'diagram' ? 'Spatial diagram view' : 'Stacked list view'}
              >
                {mode === 'diagram' ? '◇ Diagram' : '☰ List'}
              </button>
            )
          })}
        </div>
      )}

      {/* Diagram view — shown on screen when active, always rendered for print */}
      <div
        className={showDiagram ? 'fml-diagram-view' : 'fml-diagram-view hidden print:block'}
      >
        <DesktopDiagramLayout
          layoutResult={layoutResult}
          nodes={nodes}
          containerWidth={containerWidth}
          nodeValues={nodeValues}
          onFieldChange={handleFieldChange}
          readOnly={readOnly}
          isDark={isDark}
        />
      </div>

      {/* List view — shown on mobile or when toggled, hidden for print */}
      <div
        className={showList ? 'fml-list-view print:hidden' : 'fml-list-view hidden'}
      >
        <MobileStackedLayout
          nodes={nodes}
          connections={connections}
          layout={field.layout}
          nodeValues={nodeValues}
          onFieldChange={handleFieldChange}
          readOnly={readOnly}
          isDark={isDark}
        />
      </div>
    </div>
  )
}
