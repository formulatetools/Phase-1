import type { ShowWhenRule } from '@/types/worksheet'

export type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

export function resolveFieldValue(
  fieldRef: string,
  values: Record<string, FieldValue>
): unknown {
  // Plain field reference: "field-id"
  if (!fieldRef.includes('.')) {
    return values[fieldRef]
  }

  const parts = fieldRef.split('.')

  // 3-part: formulation-id.node-id.field-id
  if (parts.length === 3) {
    const [formulationId, nodeId, subFieldId] = parts
    const formulationValue = values[formulationId] as unknown as Record<string, unknown> | undefined
    if (!formulationValue?.nodes) return undefined
    const nodes = formulationValue.nodes as Record<string, Record<string, unknown>>
    return nodes?.[nodeId]?.[subFieldId]
  }

  // 2-part: table-id.column-id — checks if any row has a non-empty value in that column
  if (parts.length === 2) {
    const [parentId, subId] = parts
    const parentValue = values[parentId]
    if (Array.isArray(parentValue)) {
      // Count rows with non-empty values in the specified column
      const filledCount = parentValue.filter(row => {
        const v = (row as Record<string, unknown>)?.[subId]
        return v !== '' && v !== undefined && v !== null
      }).length
      return filledCount > 0 ? filledCount : undefined
    }
    return undefined
  }

  return undefined
}

export function evaluateShowWhen(
  rule: ShowWhenRule | undefined,
  values: Record<string, FieldValue>
): boolean {
  if (!rule) return true // No rule → always visible

  const resolved = resolveFieldValue(rule.field, values)

  switch (rule.operator) {
    case 'equals':
      // eslint-disable-next-line eqeqeq
      return resolved == rule.value
    case 'not_equals':
      // eslint-disable-next-line eqeqeq
      return resolved != rule.value
    case 'greater_than':
      return Number(resolved) > Number(rule.value)
    case 'less_than':
      return Number(resolved) < Number(rule.value)
    case 'not_empty':
      if (Array.isArray(resolved)) return resolved.length > 0
      return resolved !== '' && resolved !== undefined && resolved !== null
    case 'empty':
      if (Array.isArray(resolved)) return resolved.length === 0
      return resolved === '' || resolved === undefined || resolved === null
    case 'contains':
      if (typeof resolved === 'string' && typeof rule.value === 'string') {
        return resolved.toLowerCase().includes(rule.value.toLowerCase())
      }
      if (Array.isArray(resolved) && rule.value !== undefined) {
        return resolved.includes(String(rule.value))
      }
      return false
    default:
      return true
  }
}
