-- Dashboard RLS & Enum Fix
-- 1. Allow therapists to read their own audit_log entries (for activity feed)
-- 2. Add 'gdpr_erasure' to audit_action enum

-- ============================================================================
-- 1. AUDIT LOG — therapists can read their own entries
-- ============================================================================

CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- 2. ADD 'gdpr_erasure' TO audit_action ENUM
-- ============================================================================

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'gdpr_erasure';
