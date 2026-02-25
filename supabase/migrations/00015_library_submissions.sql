-- ============================================================================
-- 00015: Library Submission Columns on Worksheets
-- Adds fields for the contributor submission → review → publish pipeline.
-- library_status is NULL for normal custom worksheets; non-null for submissions.
-- ============================================================================

ALTER TABLE worksheets
  ADD COLUMN IF NOT EXISTS library_status TEXT DEFAULT NULL
    CHECK (library_status IN ('draft','submitted','in_review','changes_requested','approved','published','rejected')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES profiles(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_feedback TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clinical_context TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suggested_category TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS references_sources TEXT DEFAULT NULL;

-- Index for admin submissions queue queries
CREATE INDEX IF NOT EXISTS idx_worksheets_library_status
  ON worksheets(library_status) WHERE library_status IS NOT NULL;

-- Index for contributor dashboard queries
CREATE INDEX IF NOT EXISTS idx_worksheets_submitted_by
  ON worksheets(submitted_by) WHERE submitted_by IS NOT NULL;
