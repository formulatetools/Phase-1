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

// ============================================================================
// Types
// ============================================================================

interface NodePosition {
  id: string
  x: number      // left edge, in px
  y: number      // top edge, in px
  width: number
  height: number
}

type FieldValue = string | number | '' | string[]

interface FormulationFieldRendererProps {
  field: FormulationField
  values: Record<string, unknown>   // { nodes: { [nodeId]: { [fieldId]: value } } }
  onChange: (values: Record<string, unknown>) => void
  readOnly?: boolean
}

// ============================================================================
// Layout Engines
// ============================================================================

function calculateCrossSectionalPositions(
  nodes: FormulationNode[],
  containerWidth: number
): NodePosition[] {
  const isMobile = containerWidth < 540
  const gap = 12
  const nodesBySlot: Record<string, FormulationNode> = {}
  for (const n of nodes) nodesBySlot[n.slot] = n

  if (isMobile) {
    // Stack vertically: top → left → centre → right → bottom
    const order = ['top', 'left', 'centre', 'right', 'bottom']
    const w = containerWidth
    const h = 120
    let y = 0
    const positions: NodePosition[] = []
    for (const slot of order) {
      const node = nodesBySlot[slot]
      if (node) {
        positions.push({ id: node.id, x: 0, y, width: w, height: h })
        y += h + gap + 24 // extra 24 for arrow space
      }
    }
    return positions
  }

  // Desktop: classic cross layout
  const colWidth = Math.floor((containerWidth - gap * 2) / 3)
  const fullWidth = containerWidth
  const nodeHeight = 140

  const positions: NodePosition[] = []
  let yOffset = 0

  // Top node — full width
  if (nodesBySlot['top']) {
    positions.push({ id: nodesBySlot['top'].id, x: 0, y: yOffset, width: fullWidth, height: nodeHeight })
    yOffset += nodeHeight + gap + 28 // arrow space
  }

  // Middle row — 3 columns
  const middleSlots = ['left', 'centre', 'right']
  for (let i = 0; i < middleSlots.length; i++) {
    const node = nodesBySlot[middleSlots[i]]
    if (node) {
      positions.push({
        id: node.id,
        x: i * (colWidth + gap),
        y: yOffset,
        width: colWidth,
        height: nodeHeight,
      })
    }
  }
  yOffset += nodeHeight + gap + 28 // arrow space

  // Bottom node — full width
  if (nodesBySlot['bottom']) {
    positions.push({ id: nodesBySlot['bottom'].id, x: 0, y: yOffset, width: fullWidth, height: nodeHeight })
    yOffset += nodeHeight
  }

  return positions
}

function calculateRadialPositions(
  nodes: FormulationNode[],
  containerWidth: number
): NodePosition[] {
  const isMobile = containerWidth < 540
  const centre = nodes.find(n => n.slot === 'centre')
  const petals = nodes.filter(n => n.slot !== 'centre')

  if (isMobile) {
    // Stack: centre on top, petals below
    const w = containerWidth
    const h = 120
    const gap = 12
    let y = 0
    const positions: NodePosition[] = []

    if (centre) {
      positions.push({ id: centre.id, x: 0, y, width: w, height: h })
      y += h + gap + 20
    }

    for (const petal of petals) {
      positions.push({ id: petal.id, x: 0, y, width: w, height: h })
      y += h + gap
    }
    return positions
  }

  // Desktop: centre in middle, petals in a circle around it
  const centreSize = 180
  const petalWidth = Math.min(180, (containerWidth - centreSize) / 2 - 20)
  const petalHeight = 140

  // Calculate total area needed
  const radius = Math.max(centreSize + 40, petalWidth * 1.2 + centreSize / 2)
  const cx = containerWidth / 2
  const cy = radius + 20

  const positions: NodePosition[] = []

  if (centre) {
    positions.push({
      id: centre.id,
      x: cx - centreSize / 2,
      y: cy - centreSize / 2,
      width: centreSize,
      height: centreSize,
    })
  }

  const angleStep = (2 * Math.PI) / petals.length
  const startAngle = -Math.PI / 2 // Start from top

  for (let i = 0; i < petals.length; i++) {
    const angle = startAngle + i * angleStep
    const px = cx + radius * Math.cos(angle) - petalWidth / 2
    const py = cy + radius * Math.sin(angle) - petalHeight / 2
    positions.push({
      id: petals[i].id,
      x: px,
      y: py,
      width: petalWidth,
      height: petalHeight,
    })
  }

  return positions
}

function calculatePositions(
  layout: FormulationLayoutPattern | string,
  nodes: FormulationNode[],
  containerWidth: number
): NodePosition[] {
  switch (layout) {
    case 'cross_sectional':
      return calculateCrossSectionalPositions(nodes, containerWidth)
    case 'radial':
      return calculateRadialPositions(nodes, containerWidth)
    default:
      // Fallback: stack vertically
      let y = 0
      return nodes.map(n => {
        const pos = { id: n.id, x: 0, y, width: containerWidth, height: 140 }
        y += 140 + 12
        return pos
      })
  }
}

// ============================================================================
// SVG Connection Rendering
// ============================================================================

function getNodeCenter(pos: NodePosition): { x: number; y: number } {
  return { x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 }
}

function getConnectionEndpoints(
  fromPos: NodePosition,
  toPos: NodePosition
): { x1: number; y1: number; x2: number; y2: number } {
  const from = getNodeCenter(fromPos)
  const to = getNodeCenter(toPos)

  // Calculate angle between centres
  const angle = Math.atan2(to.y - from.y, to.x - from.x)

  // Start from edge of fromPos box
  const x1 = from.x + (fromPos.width / 2) * Math.cos(angle)
  const y1 = from.y + (fromPos.height / 2) * Math.sin(angle)

  // End at edge of toPos box
  const x2 = to.x - (toPos.width / 2) * Math.cos(angle)
  const y2 = to.y - (toPos.height / 2) * Math.sin(angle)

  return { x1, y1, x2, y2 }
}

function ConnectionsSVG({
  connections,
  positions,
  totalHeight,
  totalWidth,
}: {
  connections: FormulationConnection[]
  positions: NodePosition[]
  totalHeight: number
  totalWidth: number
}) {
  const posMap = new Map(positions.map(p => [p.id, p]))

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
        </marker>
        <marker id="arrowhead-reverse" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
          <polygon points="8 0, 0 3, 8 6" fill="#94a3b8" />
        </marker>
        <marker id="inhibitory-end" markerWidth="8" markerHeight="10" refX="4" refY="5" orient="auto">
          <line x1="4" y1="0" x2="4" y2="10" stroke="#94a3b8" strokeWidth="2" />
        </marker>
      </defs>

      {connections.map((conn, i) => {
        const fromPos = posMap.get(conn.from)
        const toPos = posMap.get(conn.to)
        if (!fromPos || !toPos) return null

        const { x1, y1, x2, y2 } = getConnectionEndpoints(fromPos, toPos)
        const isDashed = conn.style === 'arrow_dashed' || conn.style === 'line_dashed'
        const hasArrow = conn.style === 'arrow' || conn.style === 'arrow_dashed'
        const isInhibitory = conn.style === 'inhibitory'

        let markerEnd = ''
        let markerStart = ''
        if (hasArrow || isInhibitory) {
          if (conn.direction === 'one_way') {
            markerEnd = isInhibitory ? 'url(#inhibitory-end)' : 'url(#arrowhead)'
          } else if (conn.direction === 'both') {
            markerEnd = 'url(#arrowhead)'
            markerStart = 'url(#arrowhead-reverse)'
          }
        }

        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray={isDashed ? '6 4' : undefined}
              markerEnd={markerEnd || undefined}
              markerStart={markerStart || undefined}
            />
            {conn.label && (
              <text
                x={midX} y={midY - 6}
                textAnchor="middle"
                className="fill-primary-400 text-[10px] italic"
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
    'w-full rounded-lg border border-primary-200/50 bg-surface/80 px-2 py-1.5 text-sm text-primary-800 placeholder-primary-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30'

  if (readOnly) {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '')
    return (
      <div className="space-y-0.5">
        {field.label && (
          <p className="text-[10px] font-medium text-primary-500">{field.label}</p>
        )}
        {displayValue ? (
          <p className="text-sm text-primary-700">{displayValue}</p>
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
            rows={3}
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
              <label key={opt.id} className="flex items-center gap-2 text-xs text-primary-700">
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
// Node Card
// ============================================================================

function FormulationNodeCard({
  node,
  nodeValues,
  onFieldChange,
  readOnly,
  style,
}: {
  node: FormulationNode
  nodeValues: Record<string, FieldValue>
  onFieldChange: (fieldId: string, value: FieldValue) => void
  readOnly?: boolean
  style?: React.CSSProperties
}) {
  const colours = getColourFromHex(node.domain_colour)

  return (
    <div
      className="absolute rounded-xl border-2 p-3 transition-shadow hover:shadow-md"
      style={{
        ...style,
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
            value={nodeValues[field.id] ?? ''}
            onChange={val => onFieldChange(field.id, val)}
            readOnly={readOnly}
          />
        ))}
      </div>
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

  // Calculate positions
  const positions = calculatePositions(field.layout, nodes, containerWidth)

  // Calculate total height
  const totalHeight = positions.reduce(
    (max, p) => Math.max(max, p.y + p.height),
    0
  ) + 20

  // Get node values
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

  return (
    <div className="space-y-2">
      {config?.show_title && config.title && (
        <h3 className="text-center text-sm font-semibold text-primary-700">
          {config.title}
        </h3>
      )}
      <div
        ref={containerRef}
        className="relative"
        style={{ minHeight: totalHeight }}
      >
        {/* Connection arrows (behind nodes) */}
        <ConnectionsSVG
          connections={connections}
          positions={positions}
          totalHeight={totalHeight}
          totalWidth={containerWidth}
        />

        {/* Node cards */}
        {nodes.map(node => {
          const pos = positions.find(p => p.id === node.id)
          if (!pos) return null

          return (
            <FormulationNodeCard
              key={node.id}
              node={node}
              nodeValues={nodeValues[node.id] || {}}
              onFieldChange={(fieldId, value) =>
                handleFieldChange(node.id, fieldId, value)
              }
              readOnly={readOnly}
              style={{
                left: pos.x,
                top: pos.y,
                width: pos.width,
                minHeight: pos.height,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
