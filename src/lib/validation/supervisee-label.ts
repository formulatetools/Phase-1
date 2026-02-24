/**
 * Label validation for supervisees.
 *
 * Supervisees are professionals, so names are expected and acceptable.
 * We still block obvious PII identifiers (NHS numbers, NI numbers, emails)
 * but do NOT warn about names.
 */

import {
  EMAIL_RE,
  PHONE_RE,
  NHS_NUMBER_RE,
  NI_NUMBER_RE,
  POSTCODE_RE,
  DOB_RE,
} from '@/lib/validation/client-label'
import type { LabelValidation } from '@/lib/validation/client-label'

export function validateSuperviseeLabel(label: string): LabelValidation {
  const trimmed = label.trim()

  // Length checks
  if (trimmed.length === 0) {
    return { valid: false, error: 'Supervisee label cannot be empty.' }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Supervisee label must be 50 characters or fewer.' }
  }

  // Hard blocks — definite PII identifiers
  if (EMAIL_RE.test(trimmed)) {
    return { valid: false, error: 'Supervisee labels must not contain email addresses.' }
  }

  if (NHS_NUMBER_RE.test(trimmed)) {
    return { valid: false, error: 'Supervisee labels must not contain NHS numbers.' }
  }

  if (NI_NUMBER_RE.test(trimmed)) {
    return { valid: false, error: 'Supervisee labels must not contain National Insurance numbers.' }
  }

  if (DOB_RE.test(trimmed)) {
    return { valid: false, error: 'Supervisee labels must not contain dates of birth.' }
  }

  if (POSTCODE_RE.test(trimmed)) {
    return { valid: false, error: 'Supervisee labels must not contain postcodes.' }
  }

  // Phone numbers — only block if 7+ digits
  const digitCount = (trimmed.match(/\d/g) || []).length
  if (PHONE_RE.test(trimmed) && digitCount >= 7) {
    return { valid: false, error: 'Supervisee labels must not contain phone numbers.' }
  }

  // No name warnings — supervisees are professionals, names are expected
  return { valid: true }
}
