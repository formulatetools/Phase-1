-- Idempotency table for webhook event processing.
-- Prevents duplicate processing when Stripe/Resend retry delivery.

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,               -- Stripe event ID (evt_...) or Resend message ID
  source TEXT NOT NULL,              -- 'stripe' or 'resend'
  event_type TEXT NOT NULL,          -- e.g. 'checkout.session.completed'
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-cleanup: drop rows older than 7 days (webhooks won't retry beyond that)
CREATE INDEX idx_webhook_events_processed_at ON webhook_events (processed_at);

-- RLS: only service role accesses this table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
