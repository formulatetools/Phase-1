-- Prevent duplicate welcome emails on auth callback replay.
-- The flag is set atomically before sending, so concurrent requests
-- won't both pass the guard.
ALTER TABLE profiles
  ADD COLUMN welcome_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Mark all existing users so they never receive a duplicate.
UPDATE profiles SET welcome_email_sent_at = created_at WHERE created_at < NOW();
