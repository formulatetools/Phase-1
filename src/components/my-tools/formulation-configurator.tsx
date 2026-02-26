'use client'

import { useState } from 'react'
import type {
  FormulationField,
  FormulationNode,
  FormulationConnection,
  FormulationLayoutPattern,
  FormulationNodeField,
  FormulationNodeFieldType,
} from '@/types/worksheet'
import { DOMAIN_COLOUR_PALETTE } from '@/lib/domain-colors'

// ============================================================================
// Defaults
// ============================================================================

function createCrossSectionalDefaults(): {
  nodes: FormulationNode[]
  connections: FormulationConnection[]
} {
  return {
    nodes: [
      {
        id: 'trigger',
        slot: 'top',
        label: 'Situation / Trigger',
        domain_colour: '#64748b',
        fields: [
          { id: 'trigger_text', type: 'textarea', placeholder: 'What triggered this?' },
        ],
      },
      {
        id: 'thoughts',
        slot: 'left',
        label: 'Thoughts',
        domain_colour: '#2563eb',
        fields: [
          { id: 'thought_content', type: 'textarea', placeholder: 'What went through your mind?' },
        ],
      },
      {
        id: 'emotions',
        slot: 'centre',
        label: 'Emotions',
        domain_colour: '#dc2626',
        fields: [
          { id: 'emotions_text', type: 'textarea', placeholder: 'What did you feel?' },
        ],
      },
      {
        id: 'physical',
        slot: 'right',
        label: 'Physical Sensations',
        domain_colour: '#16a34a',
        fields: [
          { id: 'sensations_text', type: 'textarea', placeholder: 'What body sensations did you notice?' },
        ],
      },
      {
        id: 'behaviour',
        slot: 'bottom',
        label: 'Behaviour',
        domain_colour: '#9333ea',
        fields: [
          { id: 'behaviour_text', type: 'textarea', placeholder: 'What did you do?' },
        ],
      },
    ],
    connections: [
      { from: 'trigger', to: 'thoughts', style: 'arrow', direction: 'one_way' },
      { from: 'trigger', to: 'emotions', style: 'arrow', direction: 'one_way' },
      { from: 'trigger', to: 'physical', style: 'arrow', direction: 'one_way' },
      { from: 'thoughts', to: 'emotions', style: 'arrow', direction: 'both' },
      { from: 'thoughts', to: 'physical', style: 'arrow', direction: 'both' },
      { from: 'emotions', to: 'physical', style: 'arrow', direction: 'both' },
      { from: 'thoughts', to: 'behaviour', style: 'arrow', direction: 'one_way' },
      { from: 'emotions', to: 'behaviour', style: 'arrow', direction: 'one_way' },
      { from: 'physical', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    ],
  }
}

function createRadialDefaults(): {
  nodes: FormulationNode[]
  connections: FormulationConnection[]
} {
  return {
    nodes: [
      {
        id: 'core',
        slot: 'centre',
        label: 'Core Problem',
        domain_colour: '#dc2626',
        fields: [
          { id: 'core_text', type: 'textarea', placeholder: 'Central problem or maintaining factor' },
        ],
      },
      {
        id: 'petal-0',
        slot: 'petal-0',
        label: 'Factor 1',
        domain_colour: '#2563eb',
        fields: [
          { id: 'petal_0_text', type: 'textarea', placeholder: 'Maintaining factor' },
        ],
      },
      {
        id: 'petal-1',
        slot: 'petal-1',
        label: 'Factor 2',
        domain_colour: '#16a34a',
        fields: [
          { id: 'petal_1_text', type: 'textarea', placeholder: 'Maintaining factor' },
        ],
      },
      {
        id: 'petal-2',
        slot: 'petal-2',
        label: 'Factor 3',
        domain_colour: '#9333ea',
        fields: [
          { id: 'petal_2_text', type: 'textarea', placeholder: 'Maintaining factor' },
        ],
      },
      {
        id: 'petal-3',
        slot: 'petal-3',
        label: 'Factor 4',
        domain_colour: '#e4a930',
        fields: [
          { id: 'petal_3_text', type: 'textarea', placeholder: 'Maintaining factor' },
        ],
      },
    ],
    connections: [
      { from: 'petal-0', to: 'core', style: 'arrow_dashed', direction: 'one_way' },
      { from: 'petal-1', to: 'core', style: 'arrow_dashed', direction: 'one_way' },
      { from: 'petal-2', to: 'core', style: 'arrow_dashed', direction: 'one_way' },
      { from: 'petal-3', to: 'core', style: 'arrow_dashed', direction: 'one_way' },
    ],
  }
}

const AVAILABLE_NODE_FIELD_TYPES: { type: FormulationNodeFieldType; label: string }[] = [
  { type: 'textarea', label: 'Text Area' },
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'likert', label: 'Scale' },
  { type: 'checklist', label: 'Checklist' },
  { type: 'select', label: 'Dropdown' },
]

const CONNECTION_STYLES: { value: FormulationConnection['style']; label: string }[] = [
  { value: 'arrow', label: 'Solid arrow' },
  { value: 'arrow_dashed', label: 'Dashed arrow' },
  { value: 'line', label: 'Solid line' },
  { value: 'line_dashed', label: 'Dashed line' },
  { value: 'inhibitory', label: 'Inhibitory (flat end)' },
]

const CONNECTION_DIRECTIONS: { value: FormulationConnection['direction']; label: string }[] = [
  { value: 'one_way', label: 'One-way →' },
  { value: 'both', label: 'Bidirectional ↔' },
  { value: 'none', label: 'No arrows' },
]

// ============================================================================
// Pattern Picker
// ============================================================================

const PATTERNS: { pattern: FormulationLayoutPattern; label: string; desc: string; icon: string; available: boolean }[] = [
  { pattern: 'cross_sectional', label: 'Cross-Sectional', desc: 'Five areas with bidirectional relationships', icon: '╋', available: true },
  { pattern: 'radial', label: 'Radial / Flower', desc: 'Central problem with maintaining factors', icon: '✿', available: true },
  { pattern: 'vertical_flow', label: 'Vertical Flow', desc: 'Developmental sequence', icon: '↓', available: false },
  { pattern: 'cycle', label: 'Cycle', desc: 'Circular maintaining loop', icon: '↻', available: false },
  { pattern: 'three_systems', label: 'Three Systems', desc: 'Triangular interaction model', icon: '△', available: false },
]

function PatternPicker({ onSelect }: { onSelect: (pattern: FormulationLayoutPattern) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-primary-500">Choose layout pattern</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PATTERNS.map(p => (
          <button
            key={p.pattern}
            onClick={() => p.available && onSelect(p.pattern)}
            disabled={!p.available}
            className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
              p.available
                ? 'border-primary-200 hover:border-brand hover:shadow-sm'
                : 'cursor-not-allowed border-primary-100 opacity-40'
            }`}
          >
            <span className="mb-1 block text-2xl">{p.icon}</span>
            <p className="text-xs font-semibold text-primary-700">{p.label}</p>
            <p className="text-[10px] text-primary-400">
              {p.available ? p.desc : 'Coming soon'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Colour Picker
// ============================================================================

function ColourPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {DOMAIN_COLOUR_PALETTE.map(c => (
          <button
            key={`${c.label}-${c.hex}`}
            onClick={() => onChange(c.hex)}
            className={`h-6 w-6 rounded-full border-2 transition-all ${
              value === c.hex ? 'border-primary-800 ring-2 ring-brand/30' : 'border-transparent hover:border-primary-300'
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.label}
          />
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-primary-300 text-[10px] text-primary-400 hover:border-primary-400"
          title="Custom colour"
        >
          +
        </button>
      </div>
      {showCustom && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#hex"
          className="w-24 rounded border border-primary-200 px-2 py-0.5 text-[11px] text-primary-700 focus:border-brand focus:outline-none"
        />
      )}
    </div>
  )
}

// ============================================================================
// Node Field Editor (mini inline editor for fields within nodes)
// ============================================================================

function NodeFieldEditor({
  field,
  onUpdate,
  onRemove,
}: {
  field: FormulationNodeField
  onUpdate: (f: FormulationNodeField) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary-100 bg-surface/50 px-2 py-1.5">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary-500">
            {field.type}
          </span>
          <input
            type="text"
            value={field.label || ''}
            onChange={e => onUpdate({ ...field, label: e.target.value })}
            className="flex-1 border-0 bg-transparent px-1 py-0 text-[11px] text-primary-700 placeholder:text-primary-300 focus:outline-none"
            placeholder="Field label"
          />
        </div>
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
          className="w-full border-0 bg-transparent px-1 py-0 text-[10px] text-primary-400 placeholder:text-primary-200 focus:outline-none"
          placeholder="Placeholder text"
        />
        {field.type === 'number' && (
          <div className="flex items-center gap-2 text-[10px]">
            <label className="text-primary-400">Min</label>
            <input
              type="number"
              value={field.min ?? ''}
              onChange={e => onUpdate({ ...field, min: e.target.value ? Number(e.target.value) : undefined })}
              className="w-12 rounded border border-primary-100 px-1 py-0 text-[10px]"
            />
            <label className="text-primary-400">Max</label>
            <input
              type="number"
              value={field.max ?? ''}
              onChange={e => onUpdate({ ...field, max: e.target.value ? Number(e.target.value) : undefined })}
              className="w-12 rounded border border-primary-100 px-1 py-0 text-[10px]"
            />
            <label className="text-primary-400">Suffix</label>
            <input
              type="text"
              value={field.suffix || ''}
              onChange={e => onUpdate({ ...field, suffix: e.target.value })}
              className="w-10 rounded border border-primary-100 px-1 py-0 text-[10px]"
              placeholder="%"
            />
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="rounded p-0.5 text-primary-300 hover:text-red-500"
        title="Remove field"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ============================================================================
// Node Configurator
// ============================================================================

function NodeConfigurator({
  node,
  onUpdate,
  onRemove,
  canRemove,
}: {
  node: FormulationNode
  onUpdate: (n: FormulationNode) => void
  onRemove?: () => void
  canRemove?: boolean
}) {
  const [showFieldPicker, setShowFieldPicker] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const addField = (type: FormulationNodeFieldType) => {
    const id = `nf-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`
    const newField: FormulationNodeField = { id, type, placeholder: '' }
    if (type === 'number') {
      newField.min = 0
      newField.max = 100
    }
    onUpdate({ ...node, fields: [...node.fields, newField] })
    setShowFieldPicker(false)
  }

  const updateField = (idx: number, f: FormulationNodeField) => {
    const fields = [...node.fields]
    fields[idx] = f
    onUpdate({ ...node, fields })
  }

  const removeField = (idx: number) => {
    onUpdate({ ...node, fields: node.fields.filter((_, i) => i !== idx) })
  }

  const colours = DOMAIN_COLOUR_PALETTE.find(c => c.hex === node.domain_colour)

  return (
    <div
      className="rounded-xl border-2 p-3"
      style={{ borderColor: colours?.border || node.domain_colour + '60' }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-primary-400 hover:text-primary-600"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: node.domain_colour }}
        />
        <input
          type="text"
          value={node.label}
          onChange={e => onUpdate({ ...node, label: e.target.value })}
          className="flex-1 border-0 bg-transparent text-xs font-semibold text-primary-800 placeholder:text-primary-300 focus:outline-none"
          placeholder="Node label"
        />
        <span className="text-[9px] text-primary-300">{node.slot}</span>
        {canRemove && onRemove && (
          <button
            onClick={onRemove}
            className="rounded p-1 text-primary-300 hover:text-red-500"
            title="Remove node"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mt-2 space-y-2">
          {/* Colour picker */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-primary-400">Domain colour</p>
            <ColourPicker value={node.domain_colour} onChange={hex => onUpdate({ ...node, domain_colour: hex })} />
          </div>

          {/* Description */}
          <input
            type="text"
            value={node.description || ''}
            onChange={e => onUpdate({ ...node, description: e.target.value })}
            className="w-full rounded-lg border border-primary-100 bg-surface/50 px-2 py-1 text-[11px] text-primary-600 placeholder:text-primary-300 focus:border-brand focus:outline-none"
            placeholder="Description / tooltip (optional)"
          />

          {/* Fields within node */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-primary-400">Fields</p>
            {node.fields.map((f, fi) => (
              <NodeFieldEditor
                key={f.id}
                field={f}
                onUpdate={nf => updateField(fi, nf)}
                onRemove={() => removeField(fi)}
              />
            ))}

            {showFieldPicker ? (
              <div className="rounded-lg border border-primary-100 bg-surface/50 p-2">
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_NODE_FIELD_TYPES.map(ft => (
                    <button
                      key={ft.type}
                      onClick={() => addField(ft.type)}
                      className="rounded border border-primary-100 px-2 py-1 text-[10px] font-medium text-primary-600 hover:border-brand/30 hover:bg-brand/5"
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowFieldPicker(false)} className="mt-1 text-[10px] text-primary-400">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFieldPicker(true)}
                className="flex items-center gap-1 text-[10px] font-medium text-primary-400 hover:text-brand"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add field
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Connection Editor
// ============================================================================

function ConnectionEditor({
  connections,
  nodes,
  onChange,
}: {
  connections: FormulationConnection[]
  nodes: FormulationNode[]
  onChange: (conns: FormulationConnection[]) => void
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const updateConnection = (idx: number, conn: FormulationConnection) => {
    const newConns = [...connections]
    newConns[idx] = conn
    onChange(newConns)
  }

  const removeConnection = (idx: number) => {
    onChange(connections.filter((_, i) => i !== idx))
    if (editingIndex === idx) setEditingIndex(null)
  }

  const addConnection = () => {
    if (nodes.length < 2) return
    const newConn: FormulationConnection = {
      from: nodes[0].id,
      to: nodes[1].id,
      style: 'arrow',
      direction: 'one_way',
    }
    onChange([...connections, newConn])
    setEditingIndex(connections.length)
  }

  const directionSymbol = (d: string) => {
    if (d === 'both') return '↔'
    if (d === 'one_way') return '→'
    return '—'
  }

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium text-primary-400">Connections</p>
      <div className="space-y-1">
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from)
          const toNode = nodes.find(n => n.id === conn.to)

          if (editingIndex === i) {
            return (
              <div key={i} className="rounded-lg border border-brand/20 bg-surface/50 p-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <select
                    value={conn.from}
                    onChange={e => updateConnection(i, { ...conn, from: e.target.value })}
                    className="flex-1 rounded border border-primary-100 px-1.5 py-0.5 text-[11px]"
                  >
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                  <span className="text-[11px] text-primary-400">→</span>
                  <select
                    value={conn.to}
                    onChange={e => updateConnection(i, { ...conn, to: e.target.value })}
                    className="flex-1 rounded border border-primary-100 px-1.5 py-0.5 text-[11px]"
                  >
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={conn.style}
                    onChange={e => updateConnection(i, { ...conn, style: e.target.value as FormulationConnection['style'] })}
                    className="flex-1 rounded border border-primary-100 px-1.5 py-0.5 text-[11px]"
                  >
                    {CONNECTION_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select
                    value={conn.direction}
                    onChange={e => updateConnection(i, { ...conn, direction: e.target.value as FormulationConnection['direction'] })}
                    className="flex-1 rounded border border-primary-100 px-1.5 py-0.5 text-[11px]"
                  >
                    {CONNECTION_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <input
                  type="text"
                  value={conn.label || ''}
                  onChange={e => updateConnection(i, { ...conn, label: e.target.value || undefined })}
                  className="w-full rounded border border-primary-100 px-1.5 py-0.5 text-[11px] placeholder:text-primary-300"
                  placeholder="Label (optional)"
                />
                <button onClick={() => setEditingIndex(null)} className="text-[10px] font-medium text-brand">
                  Done
                </button>
              </div>
            )
          }

          return (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-primary-100 bg-surface/50 px-2 py-1">
              <span className="flex-1 text-[11px] text-primary-600">
                {fromNode?.label || conn.from} {directionSymbol(conn.direction)} {toNode?.label || conn.to}
                {conn.style.includes('dashed') ? ' (dashed)' : ''}
                {conn.label ? ` "${conn.label}"` : ''}
              </span>
              <button onClick={() => setEditingIndex(i)} className="text-[10px] text-primary-400 hover:text-brand">Edit</button>
              <button onClick={() => removeConnection(i)} className="text-[10px] text-primary-400 hover:text-red-500">×</button>
            </div>
          )
        })}
      </div>
      <button
        onClick={addConnection}
        disabled={nodes.length < 2}
        className="mt-1 flex items-center gap-1 text-[10px] font-medium text-primary-400 hover:text-brand disabled:opacity-30"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add connection
      </button>
    </div>
  )
}

// ============================================================================
// Main Configurator
// ============================================================================

interface FormulationConfiguratorProps {
  field: FormulationField
  onChange: (field: FormulationField) => void
}

export function FormulationConfigurator({ field, onChange }: FormulationConfiguratorProps) {
  const [collapsed, setCollapsed] = useState(false)
  const hasPattern = field.nodes && field.nodes.length > 0

  const handlePatternSelect = (pattern: FormulationLayoutPattern) => {
    const defaults = pattern === 'radial' ? createRadialDefaults() : createCrossSectionalDefaults()
    onChange({
      ...field,
      layout: pattern,
      nodes: defaults.nodes,
      connections: defaults.connections,
      formulation_config: { title: '', show_title: false },
    })
  }

  const updateNodes = (nodes: FormulationNode[]) => {
    onChange({ ...field, nodes })
  }

  const updateConnections = (connections: FormulationConnection[]) => {
    onChange({ ...field, connections })
  }

  const isRadial = field.layout === 'radial'
  const nodes = field.nodes || []
  const connections = field.connections || []
  const petals = isRadial ? nodes.filter(n => n.slot !== 'centre') : []

  const addPetal = () => {
    if (!isRadial || petals.length >= 8) return
    const idx = petals.length
    const colours = ['#2563eb', '#16a34a', '#9333ea', '#e4a930', '#dc2626', '#db2777', '#ea580c', '#0d9488']
    const newPetal: FormulationNode = {
      id: `petal-${idx}`,
      slot: `petal-${idx}`,
      label: `Factor ${idx + 1}`,
      domain_colour: colours[idx % colours.length],
      fields: [
        { id: `petal_${idx}_text`, type: 'textarea', placeholder: 'Maintaining factor' },
      ],
    }
    const newNodes = [...nodes, newPetal]
    const newConns = [...connections, { from: newPetal.id, to: 'core', style: 'arrow_dashed' as const, direction: 'one_way' as const }]
    onChange({ ...field, nodes: newNodes, connections: newConns })
  }

  const removePetal = (petalId: string) => {
    if (!isRadial || petals.length <= 3) return
    const newNodes = nodes.filter(n => n.id !== petalId)
    const newConns = connections.filter(c => c.from !== petalId && c.to !== petalId)
    onChange({ ...field, nodes: newNodes, connections: newConns })
  }

  // Compact view
  if (collapsed && hasPattern) {
    return (
      <div
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3"
        onClick={() => setCollapsed(false)}
      >
        <span className="text-lg">{field.layout === 'radial' ? '✿' : '╋'}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-primary-700">
            {field.layout === 'radial' ? 'Radial' : 'Cross-Sectional'} Formulation
          </p>
          <p className="text-[10px] text-primary-400">
            {nodes.length} nodes, {connections.length} connections
          </p>
        </div>
        <span className="text-[10px] text-primary-400">Click to expand</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Formulation Configuration
        </p>
        {hasPattern && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-[10px] text-primary-400 hover:text-primary-600"
          >
            Collapse
          </button>
        )}
      </div>

      {/* Title config */}
      {hasPattern && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-primary-500">
            <input
              type="checkbox"
              checked={field.formulation_config?.show_title ?? false}
              onChange={e =>
                onChange({
                  ...field,
                  formulation_config: { ...field.formulation_config, show_title: e.target.checked },
                })
              }
              className="h-3.5 w-3.5 rounded border-primary-300"
            />
            Show title
          </label>
          {field.formulation_config?.show_title && (
            <input
              type="text"
              value={field.formulation_config?.title || ''}
              onChange={e =>
                onChange({
                  ...field,
                  formulation_config: { ...field.formulation_config, title: e.target.value },
                })
              }
              className="flex-1 rounded-lg border border-primary-200 bg-surface px-2 py-1 text-[11px] text-primary-700 placeholder:text-primary-300 focus:border-brand focus:outline-none"
              placeholder="Formulation title"
            />
          )}
        </div>
      )}

      {/* Pattern picker (if no pattern selected yet) */}
      {!hasPattern && <PatternPicker onSelect={handlePatternSelect} />}

      {/* Node configurators */}
      {hasPattern && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-primary-400">Nodes</p>
              {isRadial && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => removePetal(petals[petals.length - 1]?.id)}
                    disabled={petals.length <= 3}
                    className="rounded border border-primary-200 px-2 py-0.5 text-[10px] text-primary-400 hover:bg-primary-50 disabled:opacity-30"
                  >
                    − Petal
                  </button>
                  <button
                    onClick={addPetal}
                    disabled={petals.length >= 8}
                    className="rounded border border-primary-200 px-2 py-0.5 text-[10px] text-primary-400 hover:bg-primary-50 disabled:opacity-30"
                  >
                    + Petal
                  </button>
                  <span className="text-[9px] text-primary-300">{petals.length}/8</span>
                </div>
              )}
            </div>
            {nodes.map(node => (
              <NodeConfigurator
                key={node.id}
                node={node}
                onUpdate={updated => updateNodes(nodes.map(n => n.id === updated.id ? updated : n))}
                onRemove={isRadial && node.slot !== 'centre' ? () => removePetal(node.id) : undefined}
                canRemove={isRadial && node.slot !== 'centre' && petals.length > 3}
              />
            ))}
          </div>

          {/* Connection editor */}
          <ConnectionEditor
            connections={connections}
            nodes={nodes}
            onChange={updateConnections}
          />

          {/* Change pattern button */}
          <button
            onClick={() => onChange({ ...field, nodes: [], connections: [], layout: 'cross_sectional' })}
            className="text-[10px] text-primary-400 hover:text-red-500"
          >
            Change layout pattern...
          </button>
        </>
      )}
    </div>
  )
}
