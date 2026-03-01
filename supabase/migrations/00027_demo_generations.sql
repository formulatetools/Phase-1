-- Demo generation tracking: 1 free AI generation per IP per calendar month
-- Used by the unauthenticated landing page teaser to gate demo usage.

CREATE TABLE demo_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast IP lookups within a month window
CREATE INDEX idx_demo_generations_ip_created
  ON demo_generations (ip_address, created_at DESC);

-- RLS: only the service role (admin client) should access this table.
-- No user-facing policies — the API route uses the admin client.
ALTER TABLE demo_generations ENABLE ROW LEVEL SECURITY;
