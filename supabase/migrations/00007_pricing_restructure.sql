-- Add 'starter' tier to subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'starter';
