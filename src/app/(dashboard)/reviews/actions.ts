'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ContributorRoles, ClinicalAccuracy, ReviewCompleteness, ReviewUsability, ReviewRecommendation } from '@/types/database'

interface ReviewData {
  clinical_accuracy: ClinicalAccuracy
  clinical_accuracy_notes: string | null
  completeness: ReviewCompleteness
  completeness_notes: string | null
  usability: ReviewUsability
  usability_notes: string | null
  suggested_changes: string | null
  recommendation: ReviewRecommendation
}

export async function submitReview(worksheetId: string, data: ReviewData): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  // Verify clinical_reviewer role
  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.clinical_reviewer) redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Verify reviewer is assigned and hasn't already completed the review
  const { data: review } = await admin
    .from('worksheet_reviews')
    .select('id, completed_at')
    .eq('worksheet_id', worksheetId)
    .eq('reviewer_id', user.id)
    .single()

  if (!review) return

  const r = review as { id: string; completed_at: string | null }
  if (r.completed_at) return // Already completed

  // Validate required fields
  if (!data.clinical_accuracy || !data.completeness || !data.usability || !data.recommendation) return

  // Update the review
  await admin
    .from('worksheet_reviews')
    .update({
      clinical_accuracy: data.clinical_accuracy,
      clinical_accuracy_notes: data.clinical_accuracy_notes,
      completeness: data.completeness,
      completeness_notes: data.completeness_notes,
      usability: data.usability,
      usability_notes: data.usability_notes,
      suggested_changes: data.suggested_changes,
      recommendation: data.recommendation,
      completed_at: new Date().toISOString(),
    })
    .eq('id', r.id)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'worksheet_review',
    entity_id: worksheetId,
    metadata: {
      review_id: r.id,
      recommendation: data.recommendation,
      clinical_accuracy: data.clinical_accuracy,
      completeness: data.completeness,
      usability: data.usability,
    },
  })

  revalidatePath(`/reviews/${worksheetId}`)
  revalidatePath('/dashboard')
  revalidatePath(`/admin/submissions/${worksheetId}`)
}
