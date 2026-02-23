-- Feature Requests: user-submitted feature ideas with upvoting and admin triage

-- ── Enums ──────────────────────────────────────────────────────────────────
CREATE TYPE feature_request_status AS ENUM (
  'submitted',
  'under_review',
  'planned',
  'shipped',
  'declined'
);

CREATE TYPE feature_request_category AS ENUM (
  'new_worksheet_or_tool',
  'new_psychometric_measure',
  'platform_feature',
  'integration',
  'other'
);

-- ── Feature Requests table ─────────────────────────────────────────────────
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category feature_request_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  current_tool TEXT,
  status feature_request_status NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Votes junction table ───────────────────────────────────────────────────
CREATE TABLE feature_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feature_request_id, user_id)
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX idx_feature_requests_shipped_at ON feature_requests(shipped_at DESC) WHERE shipped_at IS NOT NULL;
CREATE INDEX idx_feature_request_votes_request ON feature_request_votes(feature_request_id);
CREATE INDEX idx_feature_request_votes_user ON feature_request_votes(user_id);

-- ── Updated-at trigger (reuses existing function) ──────────────────────────
CREATE TRIGGER set_updated_at_feature_requests
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS: feature_requests ──────────────────────────────────────────────────
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Users see own requests (any status) + others' visible requests
CREATE POLICY feature_requests_select_user ON feature_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR status IN ('under_review', 'planned', 'shipped')
  );

-- Admins see everything
CREATE POLICY feature_requests_select_admin ON feature_requests
  FOR SELECT USING (get_user_role() = 'admin');

-- Users can submit their own requests
CREATE POLICY feature_requests_insert_user ON feature_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only admins can update (status changes, admin notes)
CREATE POLICY feature_requests_update_admin ON feature_requests
  FOR UPDATE USING (get_user_role() = 'admin');

-- ── RLS: feature_request_votes ─────────────────────────────────────────────
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read votes (needed for counts)
CREATE POLICY feature_request_votes_select ON feature_request_votes
  FOR SELECT USING (true);

-- Users can add their own votes
CREATE POLICY feature_request_votes_insert ON feature_request_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can remove their own votes (toggle)
CREATE POLICY feature_request_votes_delete ON feature_request_votes
  FOR DELETE USING (user_id = auth.uid());

-- ── Extend audit_action enum ───────────────────────────────────────────────
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'upvote';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'remove_upvote';
