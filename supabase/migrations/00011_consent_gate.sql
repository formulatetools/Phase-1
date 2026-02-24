-- Migration: Client Consent Gate + Blank PDF Download
-- Adds homework_consent table, homework_events table, pdf_downloaded status, and completion tracking columns

-- 1. homework_consent table (anonymous — uses relationship_id, not client_id)
CREATE TABLE homework_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL DEFAULT 'homework_digital_completion'
    CHECK (consent_type = 'homework_digital_completion'),
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique partial index: one active consent per relationship
CREATE UNIQUE INDEX idx_homework_consent_active
  ON homework_consent(relationship_id)
  WHERE withdrawn_at IS NULL;

-- RLS
ALTER TABLE homework_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY homework_consent_therapist_select ON homework_consent
  FOR SELECT USING (
    relationship_id IN (
      SELECT id FROM therapeutic_relationships WHERE therapist_id = auth.uid()
    )
  );

-- 2. homework_events table (anonymous event log)
CREATE TABLE homework_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES worksheet_assignments(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'consent_granted', 'consent_declined', 'consent_withdrawn', 'pdf_downloaded'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_homework_events_relationship ON homework_events(relationship_id);

ALTER TABLE homework_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY homework_events_therapist_select ON homework_events
  FOR SELECT USING (
    relationship_id IN (
      SELECT id FROM therapeutic_relationships WHERE therapist_id = auth.uid()
    )
  );

-- 3. Add pdf_downloaded to assignment_status enum
ALTER TYPE assignment_status ADD VALUE IF NOT EXISTS 'pdf_downloaded';

-- 4. New columns on worksheet_assignments
ALTER TABLE worksheet_assignments
  ADD COLUMN completion_method TEXT NOT NULL DEFAULT 'digital'
  CHECK (completion_method IN ('digital', 'paper'));

ALTER TABLE worksheet_assignments
  ADD COLUMN pdf_downloaded_at TIMESTAMPTZ;
