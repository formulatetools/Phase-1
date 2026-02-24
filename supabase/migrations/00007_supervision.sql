-- Migration: Add supervision support
-- Adds relationship_type column and Supervision category

-- 1. Add relationship_type to therapeutic_relationships
ALTER TABLE therapeutic_relationships
  ADD COLUMN relationship_type TEXT NOT NULL DEFAULT 'clinical'
  CHECK (relationship_type IN ('clinical', 'supervision'));

-- 2. Add index for filtering by type
CREATE INDEX idx_relationships_type ON therapeutic_relationships(therapist_id, relationship_type)
  WHERE deleted_at IS NULL;

-- 3. Add "Supervision" category
INSERT INTO categories (name, slug, description, display_order)
VALUES ('Supervision', 'supervision', 'Tools for structured clinical supervision', 10);
