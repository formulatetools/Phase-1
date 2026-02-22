-- Formulate: Initial Schema
-- Phase 1 + Phase 2 tables, RLS policies, and soft deletes

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('therapist', 'client', 'admin');
CREATE TYPE subscription_status AS ENUM ('free', 'active', 'cancelled', 'past_due');
CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'professional');
CREATE TYPE stripe_subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE access_type AS ENUM ('view', 'interact', 'export');
CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'assign', 'share');
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'reviewed');
CREATE TYPE response_source AS ENUM ('manual', 'assigned', 'ai_generated');
CREATE TYPE relationship_status AS ENUM ('active', 'discharged', 'paused');
CREATE TYPE training_progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE ema_schedule_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE consent_type AS ENUM ('data_processing', 'ema_notifications', 'data_sharing_with_therapist', 'research_participation', 'marketing');
CREATE TYPE consent_status AS ENUM ('granted', 'withdrawn');
CREATE TYPE required_tier AS ENUM ('standard', 'professional');

-- ============================================================================
-- PHASE 1 TABLES
-- ============================================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'therapist',
  organisation_id UUID,
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  monthly_download_count INTEGER NOT NULL DEFAULT 0,
  download_count_reset_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organisations
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from profiles to organisations (after both tables exist)
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_organisation
  FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status stripe_subscription_status NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Worksheets
CREATE TABLE worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  schema JSONB NOT NULL DEFAULT '{"version":1,"sections":[]}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Worksheet Access Log
CREATE TABLE worksheet_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  access_type access_type NOT NULL,
  counted_as_download BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log (append-only)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PHASE 2 TABLES (schema only, no UI)
-- ============================================================================

-- Worksheet Assignments
CREATE TABLE worksheet_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status assignment_status NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Worksheet Responses
CREATE TABLE worksheet_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES worksheet_assignments(id) ON DELETE SET NULL,
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL DEFAULT '{}',
  source response_source NOT NULL DEFAULT 'manual',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Measure Administrations
CREATE TABLE measure_administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  measure_type TEXT NOT NULL,
  session_number INTEGER,
  scores JSONB NOT NULL DEFAULT '{}',
  administered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Therapeutic Relationships
CREATE TABLE therapeutic_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status relationship_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Training Modules
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  required_tier required_tier NOT NULL DEFAULT 'professional',
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Training Content
CREATE TABLE training_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Training Progress
CREATE TABLE training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
  status training_progress_status NOT NULL DEFAULT 'not_started',
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMA Schedules
CREATE TABLE ema_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL DEFAULT '{"version":1,"sections":[]}',
  schedule_config JSONB NOT NULL DEFAULT '{}',
  status ema_schedule_status NOT NULL DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMA Responses
CREATE TABLE ema_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES ema_schedules(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL DEFAULT '{}',
  prompted_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  latitude DECIMAL,
  longitude DECIMAL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMI Rules
CREATE TABLE emi_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES ema_schedules(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition JSONB NOT NULL DEFAULT '{}',
  intervention JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_triggered INTEGER NOT NULL DEFAULT 0,
  max_triggers_per_day INTEGER NOT NULL DEFAULT 3,
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consent Records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type consent_type NOT NULL,
  status consent_status NOT NULL DEFAULT 'granted',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_worksheets_category_id ON worksheets(category_id);
CREATE INDEX idx_worksheets_slug ON worksheets(slug);
CREATE INDEX idx_worksheets_is_published ON worksheets(is_published);
CREATE INDEX idx_worksheets_tags ON worksheets USING GIN(tags);
CREATE INDEX idx_worksheet_access_log_user_id ON worksheet_access_log(user_id);
CREATE INDEX idx_worksheet_access_log_worksheet_id ON worksheet_access_log(worksheet_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_worksheets BEFORE UPDATE ON worksheets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_training_modules BEFORE UPDATE ON training_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_training_content BEFORE UPDATE ON training_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_training_progress BEFORE UPDATE ON training_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_ema_schedules BEFORE UPDATE ON ema_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_emi_rules BEFORE UPDATE ON emi_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE measure_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ema_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ema_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Phase 1 tables only)
-- ============================================================================

-- Helper: get the current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES --

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT USING (get_user_role() = 'admin');

-- Service role can insert profiles (for signup trigger)
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ORGANISATIONS --

-- Org owners can manage their orgs
CREATE POLICY organisations_select ON organisations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY organisations_insert ON organisations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY organisations_update ON organisations
  FOR UPDATE USING (owner_id = auth.uid());

-- SUBSCRIPTIONS --

-- Users can read their own subscriptions
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read all subscriptions
CREATE POLICY subscriptions_select_admin ON subscriptions
  FOR SELECT USING (get_user_role() = 'admin');

-- CATEGORIES --

-- Everyone (authenticated) can read categories
CREATE POLICY categories_select ON categories
  FOR SELECT USING (true);

-- Admins can manage categories
CREATE POLICY categories_insert_admin ON categories
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY categories_update_admin ON categories
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY categories_delete_admin ON categories
  FOR DELETE USING (get_user_role() = 'admin');

-- WORKSHEETS --

-- Everyone (authenticated) can read published, non-deleted worksheets
CREATE POLICY worksheets_select ON worksheets
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Admins can read ALL worksheets (including unpublished/deleted)
CREATE POLICY worksheets_select_admin ON worksheets
  FOR SELECT USING (get_user_role() = 'admin');

-- Admins can manage worksheets
CREATE POLICY worksheets_insert_admin ON worksheets
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY worksheets_update_admin ON worksheets
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY worksheets_delete_admin ON worksheets
  FOR DELETE USING (get_user_role() = 'admin');

-- WORKSHEET ACCESS LOG --

-- Users can read their own access logs
CREATE POLICY access_log_select_own ON worksheet_access_log
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own access logs
CREATE POLICY access_log_insert_own ON worksheet_access_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can read all access logs (for analytics)
CREATE POLICY access_log_select_admin ON worksheet_access_log
  FOR SELECT USING (get_user_role() = 'admin');

-- AUDIT LOG (append-only) --

-- Authenticated users can insert audit log entries
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can read audit logs
CREATE POLICY audit_log_select_admin ON audit_log
  FOR SELECT USING (get_user_role() = 'admin');

-- NO update or delete policies on audit_log — it is strictly append-only

-- ============================================================================
-- PROFILE AUTO-CREATION ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, subscription_status, subscription_tier, monthly_download_count, download_count_reset_at)
  VALUES (
    NEW.id,
    NEW.email,
    'therapist',
    'free',
    'free',
    0,
    now() + INTERVAL '1 month'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
