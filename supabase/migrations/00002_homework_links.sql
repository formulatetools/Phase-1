-- Homework Links Migration
-- Modifies Phase 2 tables for anonymous homework link workflow:
-- - therapeutic_relationships: client_label instead of client_id FK
-- - worksheet_assignments: token, relationship_id, expires_at, locked_at
-- - worksheet_responses: relationship_id instead of client_id

-- ============================================================================
-- 1. THERAPEUTIC RELATIONSHIPS — rebuild for label-only clients (no PII)
-- ============================================================================

-- Drop the old table (no production data — Phase 2 was schema-only)
DROP TABLE IF EXISTS worksheet_responses CASCADE;
DROP TABLE IF EXISTS worksheet_assignments CASCADE;
DROP TABLE IF EXISTS therapeutic_relationships CASCADE;

-- Recreate with client_label instead of client_id
CREATE TABLE therapeutic_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_label TEXT NOT NULL,          -- Non-identifiable label (initials, pseudonym)
  status relationship_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. WORKSHEET ASSIGNMENTS — add token, relationship_id, expiry
-- ============================================================================

CREATE TABLE worksheet_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,          -- 12-char nanoid for /hw/{token} URLs
  status assignment_status NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,              -- NULL = editable, set = read-only for client
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. WORKSHEET RESPONSES — link to relationship instead of client
-- ============================================================================

CREATE TABLE worksheet_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES worksheet_assignments(id) ON DELETE CASCADE,
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL DEFAULT '{}',
  source response_source NOT NULL DEFAULT 'assigned',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Token lookup (critical for /hw/[token] route)
CREATE UNIQUE INDEX idx_assignments_token ON worksheet_assignments(token);

-- Therapist lookups
CREATE INDEX idx_relationships_therapist ON therapeutic_relationships(therapist_id);
CREATE INDEX idx_assignments_therapist ON worksheet_assignments(therapist_id);
CREATE INDEX idx_assignments_relationship ON worksheet_assignments(relationship_id);
CREATE INDEX idx_responses_assignment ON worksheet_responses(assignment_id);
CREATE INDEX idx_responses_relationship ON worksheet_responses(relationship_id);

-- Status filtering
CREATE INDEX idx_relationships_status ON therapeutic_relationships(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assignments_status ON worksheet_assignments(status) WHERE deleted_at IS NULL;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Re-enable RLS (dropped with CASCADE)
ALTER TABLE therapeutic_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_responses ENABLE ROW LEVEL SECURITY;

-- THERAPEUTIC RELATIONSHIPS --

-- Therapists can CRUD their own relationships
CREATE POLICY relationships_select_own ON therapeutic_relationships
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY relationships_insert_own ON therapeutic_relationships
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY relationships_update_own ON therapeutic_relationships
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY relationships_delete_own ON therapeutic_relationships
  FOR DELETE USING (therapist_id = auth.uid());

-- Admins can read all
CREATE POLICY relationships_select_admin ON therapeutic_relationships
  FOR SELECT USING (get_user_role() = 'admin');

-- WORKSHEET ASSIGNMENTS --

-- Therapists can CRUD their own assignments
CREATE POLICY assignments_select_own ON worksheet_assignments
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY assignments_insert_own ON worksheet_assignments
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY assignments_update_own ON worksheet_assignments
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY assignments_delete_own ON worksheet_assignments
  FOR DELETE USING (therapist_id = auth.uid());

-- Admins can read all
CREATE POLICY assignments_select_admin ON worksheet_assignments
  FOR SELECT USING (get_user_role() = 'admin');

-- WORKSHEET RESPONSES --

-- Therapists can read responses linked to their assignments
CREATE POLICY responses_select_own ON worksheet_responses
  FOR SELECT USING (
    relationship_id IN (
      SELECT id FROM therapeutic_relationships WHERE therapist_id = auth.uid()
    )
  );

-- Admins can read all
CREATE POLICY responses_select_admin ON worksheet_responses
  FOR SELECT USING (get_user_role() = 'admin');

-- NOTE: Public INSERT for homework responses is handled via service role key
-- in the API route (bypasses RLS). No anon INSERT policy needed.

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS (for assignments table)
-- ============================================================================

-- No updated_at on these tables by design — use status + timestamps instead
