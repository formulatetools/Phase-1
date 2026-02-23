-- Custom Worksheets Migration
-- Adds columns to worksheets table for therapist-created custom worksheets.
-- Custom worksheets share the same table as curated worksheets, distinguished
-- by created_by being non-null and is_curated being false.

-- ============================================================================
-- 1. NEW ENUM TYPES
-- ============================================================================

CREATE TYPE worksheet_visibility AS ENUM ('curated', 'private', 'organisation', 'public');
CREATE TYPE tracking_frequency AS ENUM ('daily', 'weekly', 'session', 'custom');

-- ============================================================================
-- 2. ALTER WORKSHEETS TABLE
-- ============================================================================

-- created_by: NULL for curated (admin-created), therapist UUID for custom
ALTER TABLE worksheets ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- visibility: controls who can see the worksheet
ALTER TABLE worksheets ADD COLUMN visibility worksheet_visibility NOT NULL DEFAULT 'curated';

-- is_curated: true for admin-created library worksheets, false for custom
ALTER TABLE worksheets ADD COLUMN is_curated BOOLEAN NOT NULL DEFAULT true;

-- schema_version: for future schema migration support
ALTER TABLE worksheets ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 1;

-- forked_from: tracks which curated worksheet was used as a template
ALTER TABLE worksheets ADD COLUMN forked_from UUID REFERENCES worksheets(id) ON DELETE SET NULL;

-- tracking_frequency: placeholder for future repeated measures feature
ALTER TABLE worksheets ADD COLUMN tracking_frequency tracking_frequency;

-- ============================================================================
-- 3. SLUG INDEX ADJUSTMENT
-- ============================================================================

-- Replace global unique slug constraint with partial unique for curated only
-- Custom worksheets use UUID-based slugs that are inherently unique
DROP INDEX IF EXISTS worksheets_slug_key;
CREATE UNIQUE INDEX idx_worksheets_slug_curated ON worksheets(slug) WHERE is_curated = true;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX idx_worksheets_created_by ON worksheets(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_worksheets_visibility ON worksheets(visibility);
CREATE INDEX idx_worksheets_is_curated ON worksheets(is_curated);

-- ============================================================================
-- 5. RLS POLICIES FOR CUSTOM WORKSHEETS
-- ============================================================================

-- Therapists can SELECT their own custom worksheets
CREATE POLICY worksheets_select_own ON worksheets
  FOR SELECT USING (
    created_by = auth.uid() AND deleted_at IS NULL
  );

-- Therapists can INSERT custom worksheets (created_by must be self)
CREATE POLICY worksheets_insert_therapist ON worksheets
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND is_curated = false
  );

-- Therapists can UPDATE their own custom worksheets
CREATE POLICY worksheets_update_own ON worksheets
  FOR UPDATE USING (
    created_by = auth.uid()
    AND is_curated = false
  );

-- ============================================================================
-- 6. MARK EXISTING WORKSHEETS
-- ============================================================================

-- All existing worksheets are curated (admin-created library worksheets)
UPDATE worksheets SET is_curated = true, visibility = 'curated' WHERE created_by IS NULL;

-- ============================================================================
-- 7. EXTEND AUDIT ACTION ENUM
-- ============================================================================

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'fork';
