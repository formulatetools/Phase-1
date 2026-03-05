import type { WorksheetSchema } from '@/types/worksheet'

type FieldValue = string | number | '' | string[] | Record<string, string | number | ''>[]

/**
 * Collects required fields from a worksheet schema and checks which are missing values.
 * Returns the list of missing field IDs, or an empty array if all required fields are filled.
 */
export function findMissingRequiredFields(
  schema: WorksheetSchema,
  values: Record<string, FieldValue>
): string[] {
  const requiredFields = schema.sections.flatMap((s) =>
    s.fields.filter((f) => f.required)
  )
  return requiredFields
    .filter((f) => {
      const v = values[f.id]
      if (v === undefined || v === '' || v === null) return true
      // Checklist: at least one option must be selected
      if (Array.isArray(v) && v.length === 0) return true
      return false
    })
    .map((f) => f.id)
}
