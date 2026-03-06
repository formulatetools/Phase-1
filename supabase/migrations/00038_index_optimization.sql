-- Performance indexes identified via query pattern analysis.
-- All CREATE INDEX CONCURRENTLY is not supported in migrations,
-- but these are lightweight B-tree indexes on small-medium tables.

-- T1: Explicit index for portal token lookups (currently UNIQUE constraint only)
CREATE INDEX IF NOT EXISTS idx_therapeutic_relationships_portal_token
  ON therapeutic_relationships(client_portal_token)
  WHERE client_portal_token IS NOT NULL;

-- T1: Compound index for therapist assignment status queries (dashboard, pending review count)
CREATE INDEX IF NOT EXISTS idx_assignments_therapist_status
  ON worksheet_assignments(therapist_id, status)
  WHERE deleted_at IS NULL;

-- T1: Compound index for therapist relationship status queries (client list filtering)
CREATE INDEX IF NOT EXISTS idx_relationships_therapist_status
  ON therapeutic_relationships(therapist_id, status)
  WHERE deleted_at IS NULL;

-- T2: Foreign key index for worksheet_id in responses (admin submissions, joins)
CREATE INDEX IF NOT EXISTS idx_responses_worksheet_id
  ON worksheet_responses(worksheet_id);

-- T2: Foreign key index for worksheet_id in assignments (RLS join optimization)
CREATE INDEX IF NOT EXISTS idx_assignments_worksheet_id
  ON worksheet_assignments(worksheet_id);

-- T2: Chronological event lookup per relationship
CREATE INDEX IF NOT EXISTS idx_homework_events_relationship_created
  ON homework_events(relationship_id, created_at DESC);
