import { describe, it, expect } from 'vitest'
import { findMissingRequiredFields } from '@/lib/utils/homework-validation'
import type { WorksheetSchema } from '@/types/worksheet'

/** Helper to build a minimal WorksheetSchema for testing */
function makeSchema(
  fields: { id: string; required?: boolean; type?: string }[]
): WorksheetSchema {
  return {
    version: 1,
    sections: [
      {
        id: 'section-1',
        title: 'Test Section',
        fields: fields.map((f) => ({
          id: f.id,
          type: f.type || 'text',
          label: f.id,
          required: f.required ?? false,
        })),
      },
    ],
  } as WorksheetSchema
}

describe('findMissingRequiredFields', () => {
  it('returns empty array when there are no required fields', () => {
    const schema = makeSchema([
      { id: 'name' },
      { id: 'notes' },
    ])
    expect(findMissingRequiredFields(schema, {})).toEqual([])
  })

  it('returns missing required field IDs when values are empty', () => {
    const schema = makeSchema([
      { id: 'name', required: true },
      { id: 'notes' },
      { id: 'email', required: true },
    ])
    expect(findMissingRequiredFields(schema, {})).toEqual(['name', 'email'])
  })

  it('returns empty array when all required fields have values', () => {
    const schema = makeSchema([
      { id: 'name', required: true },
      { id: 'email', required: true },
    ])
    expect(
      findMissingRequiredFields(schema, { name: 'Alice', email: 'alice@example.com' })
    ).toEqual([])
  })

  it('treats empty string as missing', () => {
    const schema = makeSchema([{ id: 'name', required: true }])
    expect(findMissingRequiredFields(schema, { name: '' })).toEqual(['name'])
  })

  it('treats null as missing', () => {
    const schema = makeSchema([{ id: 'name', required: true }])
    expect(
      findMissingRequiredFields(schema, { name: null as unknown as string })
    ).toEqual(['name'])
  })

  it('treats undefined as missing', () => {
    const schema = makeSchema([{ id: 'name', required: true }])
    expect(findMissingRequiredFields(schema, {})).toEqual(['name'])
  })

  it('treats zero as a valid value (not missing)', () => {
    const schema = makeSchema([{ id: 'score', required: true, type: 'number' }])
    expect(findMissingRequiredFields(schema, { score: 0 })).toEqual([])
  })

  it('works across multiple sections', () => {
    const schema: WorksheetSchema = {
      version: 1,
      sections: [
        {
          id: 's1',
          title: 'Section 1',
          fields: [
            { id: 'mood', type: 'text', label: 'Mood', required: true },
          ],
        },
        {
          id: 's2',
          title: 'Section 2',
          fields: [
            { id: 'notes', type: 'textarea', label: 'Notes', required: true },
            { id: 'optional', type: 'text', label: 'Optional' },
          ],
        },
      ],
    } as WorksheetSchema

    expect(findMissingRequiredFields(schema, { mood: 'happy' })).toEqual(['notes'])
  })

  it('considers non-empty arrays as valid', () => {
    const schema = makeSchema([{ id: 'symptoms', required: true, type: 'checklist' }])
    expect(
      findMissingRequiredFields(schema, { symptoms: ['fatigue', 'insomnia'] })
    ).toEqual([])
  })
})
