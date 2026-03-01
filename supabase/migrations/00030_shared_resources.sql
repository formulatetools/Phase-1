-- Shared resources: therapists share links and psychoeducation articles with clients
-- Feature 1: embedded links (live immediately)
-- Feature 2: psychoeducation articles (hidden until content exists)

CREATE TYPE shared_resource_type AS ENUM ('link', 'psychoeducation');
CREATE TYPE shared_resource_status AS ENUM ('active', 'archived');

CREATE TABLE shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type shared_resource_type NOT NULL,

  -- Common fields
  title TEXT NOT NULL,
  therapist_note TEXT,
  status shared_resource_status NOT NULL DEFAULT 'active',
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Link-specific (NULL when psychoeducation)
  url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  og_site_name TEXT,
  og_fetched_at TIMESTAMPTZ,

  -- Psychoeducation-specific (NULL when link) — FK added in future migration
  article_id UUID,

  -- Lifecycle
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_link_has_url CHECK (resource_type != 'link' OR url IS NOT NULL),
  CONSTRAINT chk_psychoed_has_article CHECK (resource_type != 'psychoeducation' OR article_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_shared_resources_relationship
  ON shared_resources(relationship_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_shared_resources_therapist
  ON shared_resources(therapist_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY shared_resources_therapist_select ON shared_resources
  FOR SELECT USING (therapist_id = auth.uid() AND deleted_at IS NULL);
CREATE POLICY shared_resources_therapist_insert ON shared_resources
  FOR INSERT WITH CHECK (therapist_id = auth.uid());
CREATE POLICY shared_resources_therapist_update ON shared_resources
  FOR UPDATE USING (therapist_id = auth.uid());

-- Extend homework_events CHECK to include resource_viewed
ALTER TABLE homework_events DROP CONSTRAINT IF EXISTS homework_events_event_type_check;
ALTER TABLE homework_events ADD CONSTRAINT homework_events_event_type_check
  CHECK (event_type IN ('consent_granted', 'consent_declined', 'consent_withdrawn', 'pdf_downloaded', 'resource_viewed'));
