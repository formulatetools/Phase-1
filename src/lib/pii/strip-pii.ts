/**
 * PII stripping for document text before AI processing.
 *
 * Replaces identifiable patterns (emails, phones, NHS numbers, etc.) with
 * bracketed placeholders so the raw text never leaves the server with PII.
 * Reuses the same regex patterns used in client-label validation.
 */

import {
  EMAIL_RE,
  PHONE_RE,
  NHS_NUMBER_RE,
  NI_NUMBER_RE,
  POSTCODE_RE,
  DOB_RE,
  COMMON_NAMES,
} from '@/lib/validation/client-label'

// Names that are also common English words — excluded from the standalone name check
// to avoid false positives like "Mark your score" or "A penny for your thoughts".
// These are still caught when part of a multi-word name (e.g. "Mark Johnson").
const AMBIGUOUS_STANDALONE = new Set([
  'mark', 'grace', 'frank', 'dawn', 'dean', 'penny', 'jay', 'glen',
  'iris', 'ivy', 'lily', 'holly', 'hazel', 'amber', 'ruby', 'cole',
  'mason', 'max', 'pat', 'sue', 'bob', 'art', 'lance', 'joy',
  'hope', 'faith', 'dale', 'ray', 'bill', 'will', 'rob', 'pearl',
  'flo', 'dot', 'val',
])

export interface StripPiiResult {
  text: string
  strippedCounts: {
    emails: number
    phones: number
    nhsNumbers: number
    niNumbers: number
    postcodes: number
    dates: number
    names: number
    total: number
  }
}

/**
 * Strip personally identifiable information from text, replacing with
 * bracketed placeholders like [EMAIL], [PHONE], [NAME], etc.
 *
 * Pattern order matters — more specific patterns (NHS numbers) are applied
 * before generic ones (phone numbers) to avoid partial matches.
 */
export function stripPii(input: string): StripPiiResult {
  const counts = {
    emails: 0,
    phones: 0,
    nhsNumbers: 0,
    niNumbers: 0,
    postcodes: 0,
    dates: 0,
    names: 0,
  }

  let text = input

  // 1. Emails (most specific, avoids false positives)
  text = text.replace(new RegExp(EMAIL_RE.source, 'g'), () => {
    counts.emails++
    return '[EMAIL]'
  })

  // 2. NHS numbers (3-3-4 digit pattern — before generic phone)
  text = text.replace(new RegExp(NHS_NUMBER_RE.source, 'g'), () => {
    counts.nhsNumbers++
    return '[NHS_NUMBER]'
  })

  // 3. NI numbers (letter-digit pattern)
  text = text.replace(new RegExp(NI_NUMBER_RE.source, 'gi'), () => {
    counts.niNumbers++
    return '[NI_NUMBER]'
  })

  // 4. UK postcodes
  text = text.replace(new RegExp(POSTCODE_RE.source, 'gi'), () => {
    counts.postcodes++
    return '[POSTCODE]'
  })

  // 5. Dates (DD/MM/YYYY and variants like DD-MM-YY, DD.MM.YYYY)
  text = text.replace(new RegExp(DOB_RE.source, 'g'), () => {
    counts.dates++
    return '[DATE]'
  })

  // 6. Phone numbers — only replace if 7+ digits (mirrors client-label.ts logic)
  text = text.replace(new RegExp(PHONE_RE.source, 'g'), (match) => {
    const digitCount = (match.match(/\d/g) || []).length
    if (digitCount >= 7) {
      counts.phones++
      return '[PHONE]'
    }
    return match
  })

  // 7a. Full names (Title Case) — two or more capitalised words where at least one is a common name
  //     e.g. "Sarah Johnson" → "[NAME]", but "Thought Record" → unchanged
  text = text.replace(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    (match) => {
      const words = match.toLowerCase().split(/\s+/)
      const hasCommonName = words.some((w) => COMMON_NAMES.has(w))
      if (hasCommonName) {
        counts.names++
        return '[NAME]'
      }
      return match
    }
  )

  // 7b. Full names (ALL CAPS) — two or more uppercase words where at least one is a common name
  //     e.g. "SARAH JONES" → "[NAME]"
  text = text.replace(
    /\b([A-Z]{2,}(?:\s+[A-Z]{2,})+)\b/g,
    (match) => {
      const words = match.toLowerCase().split(/\s+/)
      const hasCommonName = words.some((w) => COMMON_NAMES.has(w))
      if (hasCommonName) {
        counts.names++
        return '[NAME]'
      }
      return match
    }
  )

  // 7c. Standalone capitalised common names — single word with initial cap that is a known name
  //     e.g. "My client Sarah mentioned..." → "My client [NAME] mentioned..."
  //     Uses word boundaries and requires the word to start with uppercase to avoid
  //     matching lowercase occurrences inside sentences like "I will grace the stage".
  //     Names that double as common English words (Mark, Grace, Dawn, etc.) are excluded
  //     to prevent false positives — they're still caught when part of a multi-word name.
  text = text.replace(
    /\b([A-Z][a-z]+)\b/g,
    (match) => {
      const lower = match.toLowerCase()
      if (COMMON_NAMES.has(lower) && !AMBIGUOUS_STANDALONE.has(lower)) {
        counts.names++
        return '[NAME]'
      }
      return match
    }
  )

  const total =
    counts.emails +
    counts.phones +
    counts.nhsNumbers +
    counts.niNumbers +
    counts.postcodes +
    counts.dates +
    counts.names

  return {
    text,
    strippedCounts: { ...counts, total },
  }
}
