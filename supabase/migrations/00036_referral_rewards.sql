-- Migration 00036: Referral Rewards
-- Adds reward tracking columns to referrals table so both referrer
-- and referee receive 30 days of Starter tier on signup.

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS referee_reward_tier text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referee_reward_expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referrer_reward_tier text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referrer_reward_expires_at timestamptz DEFAULT NULL;

-- Indexes for lazy expiry checks and cron queries
CREATE INDEX IF NOT EXISTS idx_referrals_referee_reward_expires
  ON referrals(referee_reward_expires_at)
  WHERE referee_reward_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_reward_expires
  ON referrals(referrer_reward_expires_at)
  WHERE referrer_reward_expires_at IS NOT NULL;
