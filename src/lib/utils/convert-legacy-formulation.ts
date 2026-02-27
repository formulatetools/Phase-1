/**
 * Converts a legacy formulation schema (section-based with schema.layout)
 * into the new generalised node-and-connection format that the custom
 * worksheet builder can edit.
 *
 * All three legacy layouts are supported:
 *   - formulation_cross_sectional → cross_sectional
 *   - formulation_vicious_flower  → radial
 *   - formulation_longitudinal    → vertical_flow
 */

import type {
  WorksheetSchema,
  WorksheetSection,
  FormulationNode,
  FormulationConnection,
  FormulationNodeField,
  DomainType,
} from '@/types/worksheet'

// ── Domain → hex colour mapping ──

const DOMAIN_COLOUR_MAP: Record<string, string> = {
  situation: '#8b8e94',
  thoughts: '#5b7fb5',
  emotions: '#c46b6b',
  physical: '#6b9e7e',
  behaviour: '#8b7ab5',
  reassurance: '#d4a44a',
  attention: '#8b8e94',
}

function domainToHex(domain?: DomainType): string {
  if (!domain) return '#6b7280'
  return DOMAIN_COLOUR_MAP[domain] ?? '#6b7280'
}

// ── Cross-sectional conversion ──

const CS_SLOT_MAP: Record<string, string> = {
  situation: 'top',
  thoughts: 'left',
  emotions: 'centre',
  physical: 'right',
  behaviour: 'bottom',
}

function convertCrossSectional(schema: WorksheetSchema): WorksheetSchema {
  const nodes: FormulationNode[] = []
  const otherSections: WorksheetSection[] = []

  for (const section of schema.sections) {
    const domain = section.domain as DomainType | undefined
    const slot = domain ? CS_SLOT_MAP[domain] : undefined

    if (slot) {
      // Convert section fields → node fields
      const nodeFields: FormulationNodeField[] = section.fields.map((f) => ({
        id: f.id,
        type: (f.type === 'textarea' ? 'textarea' : 'text') as FormulationNodeField['type'],
        label: f.label || '',
        placeholder: f.placeholder || '',
      }))

      nodes.push({
        id: section.id,
        slot,
        label: section.title || section.label || domain || '',
        domain_colour: domainToHex(domain),
        description: section.description,
        fields: nodeFields.length > 0 ? nodeFields : [{
          id: `${section.id}_text`,
          type: 'textarea',
          placeholder: `Enter ${(section.title || domain || '').toLowerCase()}…`,
        }],
      })
    } else {
      // Non-domain section — keep as-is in surrounding sections
      otherSections.push(section)
    }
  }

  // Default connections for the 5-areas model
  const connections: FormulationConnection[] = [
    { from: 'situation', to: 'thoughts', style: 'arrow', direction: 'one_way' },
    { from: 'situation', to: 'emotions', style: 'arrow', direction: 'one_way' },
    { from: 'situation', to: 'physical', style: 'arrow', direction: 'one_way' },
    { from: 'thoughts', to: 'emotions', style: 'arrow', direction: 'both' },
    { from: 'thoughts', to: 'physical', style: 'arrow', direction: 'both' },
    { from: 'emotions', to: 'physical', style: 'arrow', direction: 'both' },
    { from: 'thoughts', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'emotions', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'physical', to: 'behaviour', style: 'arrow', direction: 'one_way' },
  ]

  // Only include connections where both endpoints exist
  const nodeIds = new Set(nodes.map((n) => n.id))
  const validConnections = connections.filter(
    (c) => nodeIds.has(c.from) && nodeIds.has(c.to)
  )

  // Build new schema: formulation section + any extra sections
  const formulationSection: WorksheetSection = {
    id: 'formulation-section',
    title: 'Formulation',
    fields: [
      {
        id: 'main-formulation',
        type: 'formulation',
        label: 'Formulation',
        layout: 'cross_sectional',
        formulation_config: { title: 'Cross-Sectional Formulation', show_title: false },
        nodes,
        connections: validConnections,
      } as unknown as WorksheetSchema['sections'][0]['fields'][0],
    ],
  }

  return {
    version: schema.version,
    // No layout — uses default section-based rendering
    sections: [...otherSections, formulationSection],
  }
}

// ── Vicious flower conversion ──

function convertViciousFlower(schema: WorksheetSchema): WorksheetSchema {
  const nodes: FormulationNode[] = []
  const otherSections: WorksheetSection[] = []

  for (const section of schema.sections) {
    if (section.id === 'centre') {
      // Centre node
      const centreFields: FormulationNodeField[] = section.fields.map((f) => ({
        id: f.id,
        type: (f.type === 'textarea' ? 'textarea' : 'text') as FormulationNodeField['type'],
        label: f.label || '',
        placeholder: f.placeholder || '',
      }))

      nodes.push({
        id: 'centre',
        slot: 'centre',
        label: section.title || 'Central Problem',
        domain_colour: '#d4a44a',
        fields: centreFields.length > 0 ? centreFields : [{
          id: 'centre_text',
          type: 'textarea',
          placeholder: 'What is the main problem?',
        }],
      })
    } else if (section.id === 'petals' && section.default_items) {
      // Convert default petal items to individual nodes
      section.default_items.forEach((item, i) => {
        const petalFields: FormulationNodeField[] =
          section.item_template?.fields?.map((f) => ({
            id: `${f.id}_${i}`,
            type: (f.type === 'textarea' ? 'textarea' : 'text') as FormulationNodeField['type'],
            label: f.label || '',
            placeholder: f.placeholder || '',
          })) ?? [{
            id: `petal_content_${i}`,
            type: 'textarea' as const,
            placeholder: 'How does this maintain the problem?',
          }]

        nodes.push({
          id: `petal-${i}`,
          slot: `petal-${i}`,
          label: item.petal_label,
          domain_colour: domainToHex(item.domain),
          fields: petalFields,
        })
      })
    } else {
      otherSections.push(section)
    }
  }

  // Connections: each petal → centre (bidirectional)
  const connections: FormulationConnection[] = nodes
    .filter((n) => n.slot.startsWith('petal-'))
    .map((n) => ({
      from: n.id,
      to: 'centre',
      style: 'arrow' as const,
      direction: 'both' as const,
    }))

  const formulationSection: WorksheetSection = {
    id: 'formulation-section',
    title: 'Formulation',
    fields: [
      {
        id: 'main-formulation',
        type: 'formulation',
        label: 'Formulation',
        layout: 'radial',
        formulation_config: { title: 'Vicious Flower Formulation', show_title: false },
        nodes,
        connections,
      } as unknown as WorksheetSchema['sections'][0]['fields'][0],
    ],
  }

  return {
    version: schema.version,
    sections: [...otherSections, formulationSection],
  }
}

// ── Longitudinal conversion ──

function convertLongitudinal(schema: WorksheetSchema): WorksheetSchema {
  const nodes: FormulationNode[] = []
  const otherSections: WorksheetSection[] = []

  for (const section of schema.sections) {
    const isAmber = section.highlight === 'amber'
    const isRedDashed = section.highlight === 'red_dashed'
    const isFourQuadrant = section.layout === 'four_quadrant'
    const sectionLabel = section.title || section.label || ''

    // Choose colour based on highlight
    let colour = '#6b7280' // default grey
    if (isAmber) colour = '#d4a44a'
    else if (isRedDashed) colour = '#c46b6b'

    if (isFourQuadrant) {
      // Four-quadrant sections get converted as a single node with multiple fields
      const nodeFields: FormulationNodeField[] = section.fields.map((f) => ({
        id: f.id,
        type: (f.type === 'textarea' ? 'textarea' : 'text') as FormulationNodeField['type'],
        label: f.label || '',
        placeholder: f.placeholder || '',
      }))

      nodes.push({
        id: section.id,
        slot: `step-${nodes.length}`,
        label: sectionLabel,
        domain_colour: colour,
        description: section.description,
        fields: nodeFields.length > 0 ? nodeFields : [{
          id: `${section.id}_text`,
          type: 'textarea',
          placeholder: `Enter ${sectionLabel.toLowerCase()}…`,
        }],
      })
    } else if (section.fields.length > 0) {
      // Regular section → node
      const nodeFields: FormulationNodeField[] = section.fields.map((f) => ({
        id: f.id,
        type: (f.type === 'textarea' ? 'textarea' : 'text') as FormulationNodeField['type'],
        label: f.label || '',
        placeholder: f.placeholder || '',
      }))

      nodes.push({
        id: section.id,
        slot: `step-${nodes.length}`,
        label: sectionLabel,
        domain_colour: colour,
        description: section.description,
        fields: nodeFields,
      })
    } else {
      otherSections.push(section)
    }
  }

  // Sequential connections: step-0 → step-1 → step-2 → ...
  const connections: FormulationConnection[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      style: 'arrow',
      direction: 'one_way',
    })
  }

  const formulationSection: WorksheetSection = {
    id: 'formulation-section',
    title: 'Formulation',
    fields: [
      {
        id: 'main-formulation',
        type: 'formulation',
        label: 'Formulation',
        layout: 'vertical_flow',
        formulation_config: { title: 'Longitudinal Formulation', show_title: false },
        nodes,
        connections,
      } as unknown as WorksheetSchema['sections'][0]['fields'][0],
    ],
  }

  return {
    version: schema.version,
    sections: [...otherSections, formulationSection],
  }
}

// ── Main export ──

/**
 * Converts a legacy formulation schema to the new generalised format.
 * Returns the original schema unchanged if it's not a legacy formulation.
 */
export function convertLegacyFormulation(schema: WorksheetSchema): WorksheetSchema {
  if (!schema.layout) return schema

  switch (schema.layout) {
    case 'formulation_cross_sectional':
      return convertCrossSectional(schema)
    case 'formulation_vicious_flower':
      return convertViciousFlower(schema)
    case 'formulation_longitudinal':
      return convertLongitudinal(schema)
    default:
      return schema
  }
}
