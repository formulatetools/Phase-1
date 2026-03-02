-- Workspace Templates: pre-configured sets of assignments + resources
-- that therapists can create and apply to clients on onboarding.

CREATE TABLE workspace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- [{worksheet_id, expires_in_days?}]
  assignment_specs JSONB NOT NULL DEFAULT '[]',
  -- [{title, url, note?}]
  resource_specs JSONB NOT NULL DEFAULT '[]',
  default_expires_in_days INTEGER NOT NULL DEFAULT 7,
  times_applied INTEGER NOT NULL DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspace_templates_therapist
  ON workspace_templates(therapist_id) WHERE deleted_at IS NULL;

ALTER TABLE workspace_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_select_own ON workspace_templates
  FOR SELECT USING (therapist_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY templates_insert_own ON workspace_templates
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY templates_update_own ON workspace_templates
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY templates_delete_own ON workspace_templates
  FOR DELETE USING (therapist_id = auth.uid());
