-- Add onboarding flag to profiles
-- Tracks whether the welcome modal has been dismissed
ALTER TABLE profiles
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing users as already onboarded
-- so they don't see the welcome modal after deployment
UPDATE profiles SET onboarding_completed = true WHERE created_at < NOW();
