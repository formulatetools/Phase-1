-- Contributor system foundation: roles, profile, and agreement tracking

-- Contributor roles (JSONB for extensibility — avoids migration for new roles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contributor_roles JSONB
  DEFAULT '{"clinical_contributor": false, "clinical_reviewer": false, "content_writer": false}'::jsonb;

-- Contributor profile (display name, title, bio, URL for public attribution)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contributor_profile JSONB DEFAULT NULL;

-- Contributor agreement acceptance timestamp (must accept before first submission)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contributor_agreement_accepted_at TIMESTAMPTZ DEFAULT NULL;
