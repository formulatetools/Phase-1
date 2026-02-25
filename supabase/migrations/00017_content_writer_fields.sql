-- Phase 4: Content Writer Flow — add clinical context authoring fields to worksheets
-- Content writers claim published worksheets, write clinical context, submit for admin approval.

ALTER TABLE worksheets
  ADD COLUMN IF NOT EXISTS clinical_context_author UUID REFERENCES profiles(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clinical_context_status TEXT DEFAULT NULL
    CHECK (clinical_context_status IN ('claimed','submitted','approved','rejected')),
  ADD COLUMN IF NOT EXISTS clinical_context_feedback TEXT DEFAULT NULL;

-- Index for fetching worksheets by content status (admin queue, dashboard)
CREATE INDEX IF NOT EXISTS idx_worksheets_content_status
  ON worksheets(clinical_context_status)
  WHERE clinical_context_status IS NOT NULL;
