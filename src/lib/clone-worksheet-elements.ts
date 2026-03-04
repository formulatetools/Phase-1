import type { WorksheetSection, WorksheetField, FormulationField, RecordField } from '@/types/worksheet'

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/** Deep-clone a field, assigning new IDs to it and all sub-elements. */
export function cloneField(field: WorksheetField): WorksheetField {
  // Deep clone the entire field (plain serialisable JSONB — no class instances)
  const cloned = JSON.parse(JSON.stringify(field)) as WorksheetField
  cloned.id = generateId('f')

  // Re-ID sub-elements for field types that contain nested IDs
  if ((cloned.type === 'checklist' || cloned.type === 'select') && cloned.options) {
    cloned.options = cloned.options.map((opt) => ({
      ...opt,
      id: generateId('opt'),
    }))
  }

  if (cloned.type === 'table' && cloned.columns) {
    cloned.columns = cloned.columns.map((col) => ({
      ...col,
      id: generateId('col'),
    }))
  }

  if (cloned.type === 'formulation') {
    const formField = cloned as FormulationField
    const originalNodes = (JSON.parse(JSON.stringify(field)) as FormulationField).nodes || []

    if (formField.nodes) {
      // Build old-ID → new-ID mapping for connection remapping
      const nodeIdMap = new Map<string, string>()
      formField.nodes = formField.nodes.map((node, i) => {
        const newId = generateId('node')
        nodeIdMap.set(originalNodes[i]?.id || node.id, newId)
        return {
          ...node,
          id: newId,
          fields: node.fields.map((nf) => ({ ...nf, id: generateId('sf') })),
        }
      })

      // Remap connection references to new node IDs
      if (formField.connections) {
        formField.connections = formField.connections.map((conn) => ({
          ...conn,
          from: nodeIdMap.get(conn.from) || conn.from,
          to: nodeIdMap.get(conn.to) || conn.to,
        }))
      }
    }
  }

  if (cloned.type === 'record') {
    const recordField = cloned as RecordField
    if (recordField.groups) {
      recordField.groups = recordField.groups.map((group) => ({
        ...group,
        id: generateId('grp'),
        fields: group.fields.map((sf) => ({ ...sf, id: generateId('sf') })),
      }))
    }
  }

  return cloned
}

/** Deep-clone a section, assigning new IDs to the section and all its fields. */
export function cloneSection(section: WorksheetSection): WorksheetSection {
  const cloned = JSON.parse(JSON.stringify(section)) as WorksheetSection
  cloned.id = generateId('s')
  cloned.fields = section.fields.map(cloneField)
  return cloned
}
