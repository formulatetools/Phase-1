import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { TherapeuticRelationship, SubscriptionTier } from '@/types/database'
import { ClientList } from '@/components/clients/client-list'
import { SuperviseeList } from '@/components/supervision/supervisee-list'
import { ClientsTabBar } from '@/components/clients/clients-tab-bar'
import { RealtimeWrapper } from '@/components/clients/realtime-wrapper'

export const metadata = {
  title: 'Clients — Formulate',
  description: 'Manage your therapy clients, assign homework, and track progress.',
  openGraph: {
    title: 'Clients — Formulate',
    description: 'Manage your therapy clients, assign homework, and track progress.',
  },
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()
  const tier = profile.subscription_tier as SubscriptionTier
  const limits = TIER_LIMITS[tier]

  const activeTab = tab === 'supervisees' ? 'supervisees' : 'clients'
  const showSupervisees = limits.maxSupervisees > 0

  // Fetch clinical relationships, supervision relationships, and all assignments in parallel
  const [
    { data: clinicalRelationships },
    { data: supervisionRelationships },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from('therapeutic_relationships')
      .select('*')
      .eq('therapist_id', user.id)
      .eq('relationship_type', 'clinical')
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),

    supabase
      .from('therapeutic_relationships')
      .select('*')
      .eq('therapist_id', user.id)
      .eq('relationship_type', 'supervision')
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),

    supabase
      .from('worksheet_assignments')
      .select('id, relationship_id, status')
      .eq('therapist_id', user.id)
      .is('deleted_at', null),
  ])

  const clientCount = (clinicalRelationships || []).length
  const superviseeCount = (supervisionRelationships || []).length
  const activeAssignmentCount = (assignments || []).filter(
    (a) => a.status === 'assigned' || a.status === 'in_progress'
  ).length

  // Build per-relationship assignment counts
  const assignmentsByClient: Record<string, { active: number; completed: number; total: number }> = {}
  for (const a of assignments || []) {
    if (!assignmentsByClient[a.relationship_id]) {
      assignmentsByClient[a.relationship_id] = { active: 0, completed: 0, total: 0 }
    }
    assignmentsByClient[a.relationship_id].total++
    if (a.status === 'assigned' || a.status === 'in_progress') {
      assignmentsByClient[a.relationship_id].active++
    }
    if (a.status === 'completed' || a.status === 'reviewed') {
      assignmentsByClient[a.relationship_id].completed++
    }
  }

  return (
    <RealtimeWrapper therapistId={user.id}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-900">Clients</h1>
          <p className="mt-1 text-sm text-primary-500">
            {activeTab === 'supervisees'
              ? 'Manage your supervisees and assign structured supervision preparation worksheets.'
              : 'Manage your clients and assign homework. Clients are identified by non-identifiable labels only — no personal data is stored.'}
          </p>
        </div>

        <ClientsTabBar
          clientCount={clientCount}
          superviseeCount={superviseeCount}
          activeTab={activeTab}
          showSupervisees={showSupervisees}
        />

        {activeTab === 'supervisees' ? (
          <SuperviseeList
            relationships={(supervisionRelationships || []) as TherapeuticRelationship[]}
            assignmentsByClient={assignmentsByClient}
            superviseeCount={superviseeCount}
            maxSupervisees={limits.maxSupervisees}
            tier={tier}
          />
        ) : (
          <ClientList
            relationships={(clinicalRelationships || []) as TherapeuticRelationship[]}
            assignmentsByClient={assignmentsByClient}
            clientCount={clientCount}
            maxClients={limits.maxClients}
            tier={tier}
          />
        )}
      </div>
    </RealtimeWrapper>
  )
}
