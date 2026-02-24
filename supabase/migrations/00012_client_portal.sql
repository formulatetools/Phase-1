-- Migration: Client Data Portal
-- Adds client_portal_token for anonymous client access, withdrawn_at for client-initiated deletion

-- 1. Add client_portal_token to therapeutic_relationships
ALTER TABLE therapeutic_relationships
  ADD COLUMN client_portal_token TEXT UNIQUE;

-- 2. Add withdrawn_at to worksheet_assignments
ALTER TABLE worksheet_assignments
  ADD COLUMN withdrawn_at TIMESTAMPTZ;

-- 3. Add 'withdrawn' to assignment_status enum
ALTER TYPE assignment_status ADD VALUE IF NOT EXISTS 'withdrawn';
