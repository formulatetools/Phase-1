-- Optional PIN protection for client portal
-- Clients can set a 4-digit PIN to lock their therapy workspace

ALTER TABLE therapeutic_relationships
  ADD COLUMN portal_pin_hash TEXT DEFAULT NULL,
  ADD COLUMN portal_pin_salt TEXT DEFAULT NULL,
  ADD COLUMN portal_pin_set_at TIMESTAMPTZ DEFAULT NULL;

-- Rate limiting table for PIN attempts (brute force protection)
CREATE TABLE portal_pin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES therapeutic_relationships(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_pin_attempts_rel_time ON portal_pin_attempts (relationship_id, attempted_at DESC);
CREATE INDEX idx_pin_attempts_ip_time ON portal_pin_attempts (ip_hash, attempted_at DESC);
