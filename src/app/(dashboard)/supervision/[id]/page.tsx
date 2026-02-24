import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
  SubscriptionTier,
} from '@/types/database'
import { SuperviseeDetail } from '@/components/supervision/supervisee-detail'

export const metadata = { title: 'Supervisee — Formulate' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SuperviseeDetailPage({ params }: PageProps) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch the supervision relationship
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('*')
    .eq('id', id)
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')
    .is('deleted_at', null)
    .single()

  if (!relationship) notFound()

  // Fetch assignments for this supervisee
  const { data: assignments } = await supabase
    .from('worksheet_assignments')
    .select('*')
    .eq('relationship_id', id)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .order('assigned_at', { ascending: false })

  // Fetch responses for these assignments
  const assignmentIds = (assignments || []).map((a) => a.id)
  let responses: WorksheetResponse[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('worksheet_responses')
      .select('*')
      .in('assignment_id', assignmentIds)
      .is('deleted_at', null)

    responses = (data || []) as WorksheetResponse[]
  }

  // Fetch worksheets — supervision category worksheets + user's custom tools + other curated
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('*')
    .or(`and(is_published.eq.true,is_curated.eq.true),and(created_by.eq.${user.id},is_curated.eq.false)`)
    .is('deleted_at', null)
    .order('title')

  // Count total active assignments across ALL relationships (for limit check)
  const { count: totalActiveAssignments } = await supabase
    .from('worksheet_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .is('deleted_at', null)

  const tier = profile.subscription_tier as SubscriptionTier
  const limits = TIER_LIMITS[tier]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SuperviseeDetail
        relationship={relationship as TherapeuticRelationship}
        assignments={(assignments || []) as WorksheetAssignment[]}
        responses={responses}
        worksheets={(worksheets || []) as Worksheet[]}
        totalActiveAssignments={totalActiveAssignments || 0}
        maxActiveAssignments={limits.maxActiveAssignments}
        tier={tier}
        appUrl={appUrl}
      />
    </div>
  )
}
