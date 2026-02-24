/**
 * PII validation for client labels.
 *
 * Therapists should use initials, pseudonyms, or codes — never identifiable
 * information.  These checks catch common mistakes; they cannot guarantee
 * absence of PII.  The therapist retains clinical responsibility.
 */

// ── Patterns ────────────────────────────────────────────────────────────────

export const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
export const PHONE_RE = /(?:\+?\d{1,4}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{4,}/
export const NHS_NUMBER_RE = /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/
export const POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i
export const DOB_RE = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/
export const NI_NUMBER_RE = /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/i

// Common first names (UK-weighted) — kept intentionally short; catches obvious cases
export const COMMON_NAMES = new Set([
  'james', 'john', 'robert', 'michael', 'david', 'william', 'richard', 'thomas',
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'sarah',
  'jessica', 'margaret', 'emma', 'olivia', 'ava', 'sophia', 'mia', 'charlotte',
  'amelia', 'harper', 'daniel', 'matthew', 'andrew', 'christopher', 'joseph', 'anthony',
  'mark', 'paul', 'steven', 'george', 'edward', 'brian', 'kevin', 'gary',
  'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'nicholas', 'jonathan', 'stephen',
  'peter', 'oliver', 'harry', 'jack', 'charlie', 'oscar', 'leo', 'archie',
  'alfie', 'noah', 'arthur', 'freddie', 'henry', 'theo', 'max', 'isaac',
  'poppy', 'ella', 'lily', 'rosie', 'florence', 'grace', 'freya', 'ivy',
  'isla', 'willow', 'sophie', 'daisy', 'phoebe', 'ruby', 'evie', 'alice',
  'hannah', 'anna', 'lucy', 'emily', 'chloe', 'katie', 'laura', 'rachel',
  'rebecca', 'louise', 'helen', 'claire', 'karen', 'natalie', 'victoria', 'donna',
  'mohammed', 'muhammad', 'ali', 'ahmed', 'hassan', 'fatima', 'aisha', 'priya',
  'raj', 'amit', 'sanjay', 'anita', 'deepak', 'neha', 'pooja', 'ravi',
])

// ── Validation result ───────────────────────────────────────────────────────

export interface LabelValidation {
  valid: boolean
  warning?: string   // soft warning (displayed but not blocking)
  error?: string     // hard block
}

// ── Main validator ──────────────────────────────────────────────────────────

export function validateClientLabel(label: string): LabelValidation {
  const trimmed = label.trim()

  // Length checks
  if (trimmed.length === 0) {
    return { valid: false, error: 'Client label cannot be empty.' }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Client label must be 50 characters or fewer.' }
  }

  // Hard blocks — definite PII
  if (EMAIL_RE.test(trimmed)) {
    return { valid: false, error: 'Client labels must not contain email addresses.' }
  }

  if (NHS_NUMBER_RE.test(trimmed)) {
    return { valid: false, error: 'Client labels must not contain NHS numbers.' }
  }

  if (NI_NUMBER_RE.test(trimmed)) {
    return { valid: false, error: 'Client labels must not contain National Insurance numbers.' }
  }

  if (DOB_RE.test(trimmed)) {
    return { valid: false, error: 'Client labels must not contain dates of birth.' }
  }

  if (POSTCODE_RE.test(trimmed)) {
    return { valid: false, error: 'Client labels must not contain postcodes.' }
  }

  // Phone numbers — only block if 7+ digits (avoids false positives on "Client-7")
  const digitCount = (trimmed.match(/\d/g) || []).length
  if (PHONE_RE.test(trimmed) && digitCount >= 7) {
    return { valid: false, error: 'Client labels must not contain phone numbers.' }
  }

  // Soft warnings — possible PII
  const words = trimmed.toLowerCase().split(/[\s\-_]+/)

  // Check for common first names (2+ word labels with a name = likely full name)
  if (words.length >= 2) {
    const nameMatches = words.filter((w) => COMMON_NAMES.has(w))
    if (nameMatches.length >= 1) {
      return {
        valid: true,
        warning: `This looks like it may contain a name ("${nameMatches[0]}"). Use initials or a code instead.`,
      }
    }
  }

  // Single common name
  if (words.length === 1 && COMMON_NAMES.has(words[0])) {
    return {
      valid: true,
      warning: 'This looks like a first name. Consider using initials or a pseudonym instead.',
    }
  }

  return { valid: true }
}
