-- Migration: Portal consent tracking
-- Adds portal-specific consent columns to therapeutic_relationships
-- (separate from per-homework consent in homework_consent table)

ALTER TABLE therapeutic_relationships
  ADD COLUMN portal_consented_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN portal_consent_ip_hash TEXT DEFAULT NULL;
