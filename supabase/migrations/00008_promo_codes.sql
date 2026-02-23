-- Promo Codes: time-limited free access to paid tiers for personal distribution

-- ── Extend audit_action enum ─────────────────────────────────────────────────
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'redeem';

-- ── promo_codes table ────────────────────────────────────────────────────────
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  tier subscription_tier NOT NULL,
  duration_days INTEGER NOT NULL,
  max_redemptions INTEGER,                    -- null = unlimited
  redemption_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,                     -- when the code itself stops being valid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── promo_redemptions table ──────────────────────────────────────────────────
CREATE TABLE promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(promo_code_id, user_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_redemptions_user_id ON promo_redemptions(user_id);
CREATE INDEX idx_promo_redemptions_expires ON promo_redemptions(access_expires_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- promo_codes: anyone can SELECT (needed for code validation at signup)
CREATE POLICY promo_codes_select ON promo_codes
  FOR SELECT USING (true);

-- promo_codes: only admins can INSERT
CREATE POLICY promo_codes_insert_admin ON promo_codes
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- promo_codes: only admins can UPDATE (toggle is_active, increment count)
CREATE POLICY promo_codes_update_admin ON promo_codes
  FOR UPDATE USING (get_user_role() = 'admin');

-- promo_redemptions: users can SELECT their own
CREATE POLICY promo_redemptions_select_own ON promo_redemptions
  FOR SELECT USING (user_id = auth.uid());

-- promo_redemptions: admins can SELECT all
CREATE POLICY promo_redemptions_select_admin ON promo_redemptions
  FOR SELECT USING (get_user_role() = 'admin');

-- promo_redemptions: authenticated users can INSERT their own
CREATE POLICY promo_redemptions_insert_own ON promo_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── Seed example codes ───────────────────────────────────────────────────────
INSERT INTO promo_codes (code, tier, duration_days, max_redemptions) VALUES
  ('DCLINPSY',   'starter',  30, 50),
  ('SUPERVISOR', 'standard', 60, 10),
  ('BETA',       'standard', 30, 20);
