import type { WorksheetSchema, CustomFieldType } from '@/types/worksheet'

const ALLOWED_FIELD_TYPES = new Set<CustomFieldType>([
  'text',
  'textarea',
  'number',
  'likert',
  'checklist',
  'date',
  'time',
  'select',
  'table',
  'computed',
  'formulation',
  'record',
])

// Advanced layout types are curated-only
const BLOCKED_LAYOUTS = new Set(['formulation_cross_sectional', 'formulation_vicious_flower', 'formulation_longitudinal'])

export function validateCustomSchema(
  schema: WorksheetSchema
): { valid: boolean; error?: string } {
  if (!schema || typeof schema !== 'object') {
    return { valid: false, error: 'Schema is required' }
  }

  if (!Array.isArray(schema.sections)) {
    return { valid: false, error: 'Schema must have a sections array' }
  }

  if (schema.sections.length === 0) {
    return { valid: false, error: 'Schema must have at least one section' }
  }

  // Block advanced layouts
  if (schema.layout && BLOCKED_LAYOUTS.has(schema.layout)) {
    return {
      valid: false,
      error: 'Advanced layouts (formulation, decision tree, hierarchy) are not available for custom worksheets',
    }
  }

  for (const section of schema.sections) {
    if (!section.id || !Array.isArray(section.fields)) {
      return { valid: false, error: 'Each section must have an id and fields array' }
    }

    // Block decision tree and safety plan section types
    if (section.type === 'branch') {
      return {
        valid: false,
        error: 'Decision tree sections are not available for custom worksheets',
      }
    }

    for (const field of section.fields) {
      if (!field.id || !field.type) {
        return { valid: false, error: 'Each field must have an id and type' }
      }

      if (!ALLOWED_FIELD_TYPES.has(field.type as CustomFieldType)) {
        return {
          valid: false,
          error: `Field type "${field.type}" is not available for custom worksheets. Allowed types: ${[...ALLOWED_FIELD_TYPES].join(', ')}`,
        }
      }

      if (!field.label || !field.label.trim()) {
        return { valid: false, error: `Field "${field.id}" must have a label` }
      }
    }
  }

  return { valid: true }
}
