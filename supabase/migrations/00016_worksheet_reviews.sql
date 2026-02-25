-- Phase 3: Clinical Reviewer Flow — worksheet_reviews table
-- Stores structured clinical reviews assigned by admin to clinical_reviewer contributors.

CREATE TABLE worksheet_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID REFERENCES worksheets(id) NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT NULL,

  -- Structured review fields (NULL until review is submitted)
  clinical_accuracy TEXT CHECK (clinical_accuracy IN ('accurate','minor_issues','significant_concerns')),
  clinical_accuracy_notes TEXT,
  completeness TEXT CHECK (completeness IN ('complete','missing_elements','incomplete')),
  completeness_notes TEXT,
  usability TEXT CHECK (usability IN ('ready','needs_refinement','major_issues')),
  usability_notes TEXT,
  suggested_changes TEXT,
  recommendation TEXT CHECK (recommendation IN ('approve','approve_with_edits','revise_resubmit','reject')),

  -- One review per reviewer per worksheet
  UNIQUE(worksheet_id, reviewer_id)
);

-- Index for fetching all reviews for a worksheet (admin detail page)
CREATE INDEX idx_worksheet_reviews_worksheet ON worksheet_reviews(worksheet_id);

-- Index for fetching pending reviews for a reviewer (dashboard queue)
CREATE INDEX idx_worksheet_reviews_reviewer ON worksheet_reviews(reviewer_id) WHERE completed_at IS NULL;
