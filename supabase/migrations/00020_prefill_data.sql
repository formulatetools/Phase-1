-- Add prefill_data column to worksheet_assignments
-- Stores pre-populated field values that the therapist fills in during session
-- Format: { "fields": { "field-id": value, ... }, "readonly": true/false }
ALTER TABLE worksheet_assignments
  ADD COLUMN IF NOT EXISTS prefill_data JSONB DEFAULT NULL;

COMMENT ON COLUMN worksheet_assignments.prefill_data IS
  'Optional pre-populated field values set by therapist. JSON: { fields: Record<string, unknown>, readonly: boolean }';
