/**
 * Data classification mapping for Formulate.
 *
 * Referenced by the DPIA and compliance documentation. Each table/field is
 * tagged with a classification level so we can enforce appropriate handling
 * (encryption-at-rest, retention, access logging, erasure scope).
 *
 * Levels:
 *  - clinical   – special-category health data (Art 9 GDPR)
 *  - pii        – directly identifies a person
 *  - pseudonymous – linked to a person only via a separate key
 *  - operational – non-personal system data
 */

export type DataClassification = 'clinical' | 'pii' | 'pseudonymous' | 'operational'

export interface FieldClassification {
  table: string
  field: string
  classification: DataClassification
  notes?: string
}

export const DATA_MAP: FieldClassification[] = [
  // ── Profiles ─────────────────────────────────────────────────────────────
  { table: 'profiles', field: 'email', classification: 'pii' },
  { table: 'profiles', field: 'full_name', classification: 'pii' },
  { table: 'profiles', field: 'subscription_tier', classification: 'operational' },
  { table: 'profiles', field: 'role', classification: 'operational' },

  // ── Therapeutic relationships ────────────────────────────────────────────
  { table: 'therapeutic_relationships', field: 'client_label', classification: 'pseudonymous', notes: 'PII validation enforced — initials/codes only' },
  { table: 'therapeutic_relationships', field: 'therapist_id', classification: 'pii' },
  { table: 'therapeutic_relationships', field: 'status', classification: 'operational' },

  // ── Worksheet assignments ────────────────────────────────────────────────
  { table: 'worksheet_assignments', field: 'token', classification: 'pseudonymous', notes: 'Unguessable access token — no PII' },
  { table: 'worksheet_assignments', field: 'status', classification: 'operational' },
  { table: 'worksheet_assignments', field: 'due_date', classification: 'operational' },

  // ── Worksheet responses ──────────────────────────────────────────────────
  { table: 'worksheet_responses', field: 'response_data', classification: 'clinical', notes: 'Free-text clinical content — special category' },
  { table: 'worksheet_responses', field: 'relationship_id', classification: 'pseudonymous' },

  // ── Worksheets (platform content) ────────────────────────────────────────
  { table: 'worksheets', field: 'schema', classification: 'operational', notes: 'Tool definition, no patient data' },
  { table: 'worksheets', field: 'title', classification: 'operational' },

  // ── Audit log ────────────────────────────────────────────────────────────
  { table: 'audit_log', field: 'user_id', classification: 'pii' },
  { table: 'audit_log', field: 'action', classification: 'operational' },
  { table: 'audit_log', field: 'metadata', classification: 'pseudonymous', notes: 'May contain client labels (pseudonymous)' },

  // ── Consent records ──────────────────────────────────────────────────────
  { table: 'consent_records', field: 'consent_type', classification: 'operational' },
  { table: 'consent_records', field: 'user_id', classification: 'pii' },

  // ── Subscriptions ────────────────────────────────────────────────────────
  { table: 'subscriptions', field: 'stripe_customer_id', classification: 'pii', notes: 'Links to Stripe account' },
  { table: 'subscriptions', field: 'stripe_subscription_id', classification: 'operational' },
]

/**
 * Returns all fields classified at a given level.
 */
export function fieldsByClassification(level: DataClassification): FieldClassification[] {
  return DATA_MAP.filter((f) => f.classification === level)
}

/**
 * Returns the classification for a specific table.field, or undefined.
 */
export function classifyField(table: string, field: string): DataClassification | undefined {
  return DATA_MAP.find((f) => f.table === table && f.field === field)?.classification
}
