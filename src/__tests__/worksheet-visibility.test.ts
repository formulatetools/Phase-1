import { describe, it, expect } from 'vitest'
import { evaluateShowWhen, resolveFieldValue } from '@/lib/utils/worksheet-visibility'

// ── resolveFieldValue ──────────────────────────────────────────────────

describe('resolveFieldValue', () => {
  it('resolves a plain field reference', () => {
    expect(resolveFieldValue('mood', { mood: 'happy' })).toBe('happy')
  })

  it('returns undefined for a missing plain field', () => {
    expect(resolveFieldValue('mood', {})).toBeUndefined()
  })

  it('resolves a 2-part table.column reference when rows have values', () => {
    const values = {
      'thought-log': [
        { situation: 'At work', emotion: 'anxious' },
        { situation: '', emotion: 'calm' },
      ],
    }
    // 2 rows have non-empty 'emotion' → returns count (2)
    expect(resolveFieldValue('thought-log.emotion', values)).toBe(2)
  })

  it('returns undefined for a 2-part reference when all rows are empty', () => {
    const values = {
      'thought-log': [
        { situation: '', emotion: '' },
        { situation: '', emotion: '' },
      ],
    }
    expect(resolveFieldValue('thought-log.emotion', values)).toBeUndefined()
  })

  it('returns undefined for a 2-part reference when parent is not an array', () => {
    const values = { 'thought-log': 'not-a-table' }
    expect(resolveFieldValue('thought-log.emotion', values as Record<string, unknown>)).toBeUndefined()
  })

  it('resolves a 3-part formulation.node.field reference', () => {
    const values = {
      formulation: {
        nodes: {
          'core-belief': { content: 'I am worthless' },
        },
      } as unknown,
    }
    expect(resolveFieldValue('formulation.core-belief.content', values as Record<string, unknown>)).toBe(
      'I am worthless'
    )
  })

  it('returns undefined for a 3-part reference when nodes are missing', () => {
    const values = { formulation: {} as unknown }
    expect(resolveFieldValue('formulation.core-belief.content', values as Record<string, unknown>)).toBeUndefined()
  })

  it('returns undefined for 4+ part references', () => {
    expect(resolveFieldValue('a.b.c.d', { a: 'test' })).toBeUndefined()
  })
})

// ── evaluateShowWhen ───────────────────────────────────────────────────

describe('evaluateShowWhen', () => {
  it('returns true when no rule is provided', () => {
    expect(evaluateShowWhen(undefined, {})).toBe(true)
  })

  // ── equals ──
  describe('equals operator', () => {
    it('matches when values are equal (string)', () => {
      expect(
        evaluateShowWhen(
          { field: 'mood', operator: 'equals', value: 'happy' },
          { mood: 'happy' }
        )
      ).toBe(true)
    })

    it('does not match when values differ', () => {
      expect(
        evaluateShowWhen(
          { field: 'mood', operator: 'equals', value: 'happy' },
          { mood: 'sad' }
        )
      ).toBe(false)
    })

    it('uses loose equality (number/string coercion)', () => {
      expect(
        evaluateShowWhen(
          { field: 'score', operator: 'equals', value: '5' },
          { score: 5 }
        )
      ).toBe(true)
    })
  })

  // ── not_equals ──
  describe('not_equals operator', () => {
    it('matches when values differ', () => {
      expect(
        evaluateShowWhen(
          { field: 'mood', operator: 'not_equals', value: 'happy' },
          { mood: 'sad' }
        )
      ).toBe(true)
    })

    it('does not match when values are equal', () => {
      expect(
        evaluateShowWhen(
          { field: 'mood', operator: 'not_equals', value: 'happy' },
          { mood: 'happy' }
        )
      ).toBe(false)
    })
  })

  // ── greater_than / less_than ──
  describe('numeric comparisons', () => {
    it('greater_than returns true when field > value', () => {
      expect(
        evaluateShowWhen(
          { field: 'score', operator: 'greater_than', value: '3' },
          { score: 5 }
        )
      ).toBe(true)
    })

    it('greater_than returns false when field <= value', () => {
      expect(
        evaluateShowWhen(
          { field: 'score', operator: 'greater_than', value: '5' },
          { score: 5 }
        )
      ).toBe(false)
    })

    it('less_than returns true when field < value', () => {
      expect(
        evaluateShowWhen(
          { field: 'score', operator: 'less_than', value: '5' },
          { score: 3 }
        )
      ).toBe(true)
    })

    it('less_than returns false when field >= value', () => {
      expect(
        evaluateShowWhen(
          { field: 'score', operator: 'less_than', value: '3' },
          { score: 5 }
        )
      ).toBe(false)
    })
  })

  // ── not_empty / empty ──
  describe('not_empty operator', () => {
    it('returns true for a non-empty string', () => {
      expect(
        evaluateShowWhen(
          { field: 'name', operator: 'not_empty' },
          { name: 'Alice' }
        )
      ).toBe(true)
    })

    it('returns false for an empty string', () => {
      expect(
        evaluateShowWhen(
          { field: 'name', operator: 'not_empty' },
          { name: '' }
        )
      ).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(
        evaluateShowWhen({ field: 'name', operator: 'not_empty' }, {})
      ).toBe(false)
    })

    it('returns true for a non-empty array', () => {
      expect(
        evaluateShowWhen(
          { field: 'items', operator: 'not_empty' },
          { items: ['a', 'b'] }
        )
      ).toBe(true)
    })

    it('returns false for an empty array', () => {
      expect(
        evaluateShowWhen(
          { field: 'items', operator: 'not_empty' },
          { items: [] as string[] }
        )
      ).toBe(false)
    })
  })

  describe('empty operator', () => {
    it('returns true for an empty string', () => {
      expect(
        evaluateShowWhen(
          { field: 'name', operator: 'empty' },
          { name: '' }
        )
      ).toBe(true)
    })

    it('returns true for undefined', () => {
      expect(
        evaluateShowWhen({ field: 'name', operator: 'empty' }, {})
      ).toBe(true)
    })

    it('returns true for null', () => {
      expect(
        evaluateShowWhen(
          { field: 'name', operator: 'empty' },
          { name: null as unknown as string }
        )
      ).toBe(true)
    })

    it('returns false for a non-empty string', () => {
      expect(
        evaluateShowWhen(
          { field: 'name', operator: 'empty' },
          { name: 'Alice' }
        )
      ).toBe(false)
    })

    it('returns true for an empty array', () => {
      expect(
        evaluateShowWhen(
          { field: 'items', operator: 'empty' },
          { items: [] as string[] }
        )
      ).toBe(true)
    })
  })

  // ── contains ──
  describe('contains operator', () => {
    it('matches substring in a string (case-insensitive)', () => {
      expect(
        evaluateShowWhen(
          { field: 'notes', operator: 'contains', value: 'anxiety' },
          { notes: 'Client reports Anxiety symptoms' }
        )
      ).toBe(true)
    })

    it('does not match when substring is absent', () => {
      expect(
        evaluateShowWhen(
          { field: 'notes', operator: 'contains', value: 'depression' },
          { notes: 'Client reports anxiety' }
        )
      ).toBe(false)
    })

    it('matches an element in an array', () => {
      expect(
        evaluateShowWhen(
          { field: 'symptoms', operator: 'contains', value: 'insomnia' },
          { symptoms: ['fatigue', 'insomnia', 'irritability'] }
        )
      ).toBe(true)
    })

    it('does not match absent array element', () => {
      expect(
        evaluateShowWhen(
          { field: 'symptoms', operator: 'contains', value: 'headache' },
          { symptoms: ['fatigue', 'insomnia'] }
        )
      ).toBe(false)
    })

    it('returns false for non-string non-array values', () => {
      expect(
        evaluateShowWhen(
          { field: 'score', operator: 'contains', value: '5' },
          { score: 5 }
        )
      ).toBe(false)
    })
  })

  // ── unknown operator ──
  it('returns true for an unknown operator', () => {
    expect(
      evaluateShowWhen(
        { field: 'x', operator: 'unknown_op' as 'equals' },
        { x: 'val' }
      )
    ).toBe(true)
  })
})
