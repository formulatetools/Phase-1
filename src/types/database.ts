import type { WorksheetSchema } from './worksheet'

// Enum types matching the database
export type UserRole = 'therapist' | 'client' | 'admin'
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'past_due'
export type SubscriptionTier = 'free' | 'starter' | 'standard' | 'professional'
export type StripeSubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
export type AccessType = 'view' | 'interact' | 'export'
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'assign' | 'share' | 'fork' | 'upvote' | 'remove_upvote'
export type FeatureRequestStatus = 'submitted' | 'under_review' | 'planned' | 'shipped' | 'declined'
export type FeatureRequestCategory = 'new_worksheet_or_tool' | 'new_psychometric_measure' | 'platform_feature' | 'integration' | 'other'
export type WorksheetVisibility = 'curated' | 'private' | 'organisation' | 'public'
export type TrackingFrequency = 'daily' | 'weekly' | 'session' | 'custom'
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'reviewed'
export type ResponseSource = 'manual' | 'assigned' | 'ai_generated'
export type RelationshipStatus = 'active' | 'discharged' | 'paused'
export type TrainingProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type EmaScheduleStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type ConsentType = 'data_processing' | 'ema_notifications' | 'data_sharing_with_therapist' | 'research_participation' | 'marketing'
export type ConsentStatus = 'granted' | 'withdrawn'
export type RequiredTier = 'standard' | 'professional'

// Row types for each table

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  organisation_id: string | null
  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
  stripe_customer_id: string | null
  monthly_download_count: number
  download_count_reset_at: string | null
  onboarding_completed: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Organisation {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  status: StripeSubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  display_order: number
  created_at: string
}

export interface Worksheet {
  id: string
  category_id: string | null
  title: string
  slug: string
  description: string
  instructions: string
  schema: WorksheetSchema
  is_published: boolean
  is_premium: boolean
  tags: string[]
  estimated_minutes: number | null
  display_order: number
  created_by: string | null
  visibility: WorksheetVisibility
  is_curated: boolean
  schema_version: number
  forked_from: string | null
  tracking_frequency: TrackingFrequency | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface WorksheetAccessLog {
  id: string
  user_id: string
  worksheet_id: string
  access_type: AccessType
  counted_as_download: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

// Phase 2 types — defined now for schema readiness

export interface WorksheetAssignment {
  id: string
  worksheet_id: string
  therapist_id: string
  relationship_id: string
  token: string
  status: AssignmentStatus
  assigned_at: string
  due_date: string | null
  expires_at: string
  completed_at: string | null
  locked_at: string | null
  deleted_at: string | null
}

export interface WorksheetResponse {
  id: string
  assignment_id: string
  worksheet_id: string
  relationship_id: string
  response_data: Record<string, unknown>
  source: ResponseSource
  started_at: string
  completed_at: string | null
  deleted_at: string | null
  created_at: string
}

export interface MeasureAdministration {
  id: string
  client_id: string
  therapist_id: string
  measure_type: string
  session_number: number | null
  scores: Record<string, unknown>
  administered_at: string
  deleted_at: string | null
  created_at: string
}

export interface TherapeuticRelationship {
  id: string
  therapist_id: string
  client_label: string
  status: RelationshipStatus
  started_at: string
  ended_at: string | null
  deleted_at: string | null
}

export interface TrainingModule {
  id: string
  title: string
  slug: string
  description: string
  category_id: string | null
  thumbnail_url: string | null
  required_tier: RequiredTier
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface TrainingContent {
  id: string
  module_id: string
  title: string
  slug: string
  description: string
  video_url: string
  duration_seconds: number
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface TrainingProgress {
  id: string
  user_id: string
  content_id: string
  status: TrainingProgressStatus
  progress_seconds: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface EmaSchedule {
  id: string
  therapist_id: string
  client_id: string
  name: string
  description: string | null
  schema: WorksheetSchema
  schedule_config: Record<string, unknown>
  status: EmaScheduleStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface EmaResponse {
  id: string
  schedule_id: string
  client_id: string
  response_data: Record<string, unknown>
  prompted_at: string
  responded_at: string | null
  latitude: number | null
  longitude: number | null
  deleted_at: string | null
  created_at: string
}

export interface EmiRule {
  id: string
  schedule_id: string
  therapist_id: string
  client_id: string
  name: string
  condition: Record<string, unknown>
  intervention: Record<string, unknown>
  is_active: boolean
  times_triggered: number
  max_triggers_per_day: number
  cooldown_minutes: number
  created_at: string
  updated_at: string
}

export interface ConsentRecord {
  id: string
  client_id: string
  consent_type: ConsentType
  status: ConsentStatus
  granted_at: string
  withdrawn_at: string | null
  ip_address: string | null
  created_at: string
}

export interface FeatureRequest {
  id: string
  user_id: string
  category: FeatureRequestCategory
  title: string
  description: string | null
  current_tool: string | null
  status: FeatureRequestStatus
  admin_notes: string | null
  shipped_at: string | null
  created_at: string
  updated_at: string
}

export interface FeatureRequestVote {
  id: string
  feature_request_id: string
  user_id: string
  created_at: string
}

// Note: We use untyped Supabase clients and cast query results to our
// row types explicitly. This avoids fighting Supabase's complex internal
// generics which require Views, Functions, Enums, and Relationships fields.
// When Supabase CLI codegen is set up, replace with the generated types.
export type Database = Record<string, never>
