// Resource type classification utility
// Derives resource type from worksheet tags — no DB migration needed

export type ResourceType = 'worksheet' | 'formulation' | 'supervision'
export type ResourceTypeFilter = 'all' | ResourceType

/**
 * Classify a worksheet by its tags.
 * Priority: supervision > formulation > worksheet (default)
 */
export function getResourceType(tags: string[] | null | undefined): ResourceType {
  if (tags?.includes('supervision')) return 'supervision'
  if (tags?.includes('formulation')) return 'formulation'
  return 'worksheet'
}

/** Plural display label, e.g. "Supervision Tools" */
export function getResourceTypeLabel(type: ResourceType): string {
  switch (type) {
    case 'supervision':
      return 'Supervision Tools'
    case 'formulation':
      return 'Formulations'
    case 'worksheet':
      return 'Worksheets'
  }
}

/** Singular display label, e.g. "Supervision Tool" */
export function getResourceTypeSingular(type: ResourceType): string {
  switch (type) {
    case 'supervision':
      return 'Supervision Tool'
    case 'formulation':
      return 'Formulation'
    case 'worksheet':
      return 'Worksheet'
  }
}

/** Who should this resource be assigned to? */
export function getAssignmentTarget(type: ResourceType): 'client' | 'supervisee' {
  return type === 'supervision' ? 'supervisee' : 'client'
}

export const RESOURCE_TYPE_FILTERS = [
  { value: 'all' as const, label: 'All' },
  { value: 'worksheet' as const, label: 'Worksheets' },
  { value: 'formulation' as const, label: 'Formulations' },
  { value: 'supervision' as const, label: 'Supervision Tools' },
]
