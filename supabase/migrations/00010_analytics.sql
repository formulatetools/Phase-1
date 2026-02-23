-- Analytics enhancements: indexes for time-range queries + email events table

-- ============================================================================
-- ADDITIONAL INDEXES FOR ANALYTICS QUERIES
-- ============================================================================

-- Fast time-range queries on audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log(created_at);

-- Funnel / conversion queries (action + entity_type + time)
CREATE INDEX IF NOT EXISTS idx_audit_log_action_entity_time
  ON audit_log(action, entity_type, created_at);

-- Signup cohort queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON profiles(created_at);

-- Revenue queries on subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at
  ON subscriptions(created_at);

-- Worksheet access time-range queries
CREATE INDEX IF NOT EXISTS idx_worksheet_access_log_created_at
  ON worksheet_access_log(created_at);

-- ============================================================================
-- EMAIL EVENTS TABLE (for Resend webhook tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,                    -- Resend message ID
  email_to text NOT NULL,
  email_type text NOT NULL,           -- 'welcome', 'abandoned_checkout', 'engagement', etc.
  event_type text NOT NULL,           -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_type
  ON email_events(email_type, event_type);

CREATE INDEX IF NOT EXISTS idx_email_events_created
  ON email_events(created_at);

CREATE INDEX IF NOT EXISTS idx_email_events_message_id
  ON email_events(message_id);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can read email events"
  ON email_events FOR SELECT
  USING (get_user_role() = 'admin');
