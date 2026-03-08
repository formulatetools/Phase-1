import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type {
  TherapeuticRelationship,
  WorksheetAssignment,
  WorksheetResponse,
  Worksheet,
  SharedResource,
  WorkspaceTemplate,
  SubscriptionTier,
  PlanQueue,
  PlanQueueItem,
} from '@/types/database'
import { ClientDetail } from '@/components/clients/client-detail'
import { SuperviseeDetail } from '@/components/supervision/supervisee-detail'
import { RealtimeWrapper } from '@/components/clients/realtime-wrapper'

export const metadata = { title: 'Client — Formulate' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch the relationship first (needed for 404 check and type branching)
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('*')
    .eq('id', id)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!relationship) notFound()

  const tier = profile.subscription_tier as SubscriptionTier
  const limits = TIER_LIMITS[tier]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

  // Branch: supervision relationships have a lighter data profile
  if (relationship.relationship_type === 'supervision') {
    const [
      { data: assignments },
      { data: worksheets },
      { count: totalActiveAssignments },
    ] = await Promise.all([
      supabase
        .from('worksheet_assignments')
        .select('*')
        .eq('relationship_id', id)
        .eq('therapist_id', user.id)
        .is('deleted_at', null)
        .order('assigned_at', { ascending: false }),

      supabase
        .from('worksheets')
        .select('id, title, slug, description, tags, is_published, is_curated, is_premium, created_by')
        .or(`and(is_published.eq.true,is_curated.eq.true),and(created_by.eq.${user.id},is_curated.eq.false)`)
        .is('deleted_at', null)
        .order('title'),

      supabase
        .from('worksheet_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .in('status', ['assigned', 'in_progress'])
        .is('deleted_at', null),
    ])

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

    return (
      <RealtimeWrapper therapistId={user.id}>
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
      </RealtimeWrapper>
    )
  }

  // Clinical relationship — fetch full data profile
  const [
    { data: assignments },
    { data: worksheets },
    { count: totalActiveAssignments },
    { data: sharedResources },
    { data: templates },
    { data: queues },
  ] = await Promise.all([
    supabase
      .from('worksheet_assignments')
      .select('*')
      .eq('relationship_id', id)
      .eq('therapist_id', user.id)
      .is('deleted_at', null)
      .order('assigned_at', { ascending: false }),

    supabase
      .from('worksheets')
      .select('*')
      .or(`and(is_published.eq.true,is_curated.eq.true),and(created_by.eq.${user.id},is_curated.eq.false)`)
      .is('deleted_at', null)
      .order('title'),

    supabase
      .from('worksheet_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .in('status', ['assigned', 'in_progress'])
      .is('deleted_at', null),

    supabase
      .from('shared_resources')
      .select('*')
      .eq('relationship_id', id)
      .eq('therapist_id', user.id)
      .is('deleted_at', null)
      .order('shared_at', { ascending: false }),

    supabase
      .from('workspace_templates')
      .select('*')
      .eq('therapist_id', user.id)
      .is('deleted_at', null)
      .order('name'),

    supabase
      .from('plan_queues')
      .select('*')
      .eq('relationship_id', id)
      .eq('therapist_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  // Fetch responses and queue items in parallel (both depend on Phase 1 results)
  const assignmentIds = (assignments || []).map((a) => a.id)
  const queueIds = (queues || []).map((q) => q.id)

  const [responses, queueItems] = await Promise.all([
    assignmentIds.length > 0
      ? supabase
          .from('worksheet_responses')
          .select('*')
          .in('assignment_id', assignmentIds)
          .is('deleted_at', null)
          .then(({ data }) => (data || []) as WorksheetResponse[])
      : Promise.resolve([] as WorksheetResponse[]),
    queueIds.length > 0
      ? supabase
          .from('plan_queue_items')
          .select('*')
          .in('queue_id', queueIds)
          .order('position')
          .then(({ data }) => (data || []) as PlanQueueItem[])
      : Promise.resolve([] as PlanQueueItem[]),
  ])

  return (
    <RealtimeWrapper therapistId={user.id}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ClientDetail
          relationship={relationship as TherapeuticRelationship}
          assignments={(assignments || []) as WorksheetAssignment[]}
          responses={responses}
          worksheets={(worksheets || []) as Worksheet[]}
          sharedResources={(sharedResources || []) as SharedResource[]}
          templates={(templates || []) as WorkspaceTemplate[]}
          queues={(queues || []) as PlanQueue[]}
          queueItems={queueItems}
          totalActiveAssignments={totalActiveAssignments || 0}
          maxActiveAssignments={limits.maxActiveAssignments}
          tier={tier}
          appUrl={appUrl}
        />
      </div>
    </RealtimeWrapper>
  )
}
