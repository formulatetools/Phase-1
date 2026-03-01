import dynamic from 'next/dynamic'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { TherapeuticRelationship, SubscriptionTier } from '@/types/database'

const ClientList = dynamic(
  () => import('@/components/clients/client-list').then((m) => m.ClientList),
  { ssr: false }
)

export const metadata = { title: 'Clients — Formulate' }

export default async function ClientsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch relationships and assignments in parallel (independent queries)
  const [{ data: relationships }, { data: assignments }] = await Promise.all([
    supabase
      .from('therapeutic_relationships')
      .select('*')
      .eq('therapist_id', user.id)
      .eq('relationship_type', 'clinical')
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),

    supabase
      .from('worksheet_assignments')
      .select('id, relationship_id, status')
      .eq('therapist_id', user.id)
      .is('deleted_at', null),
  ])

  const tier = profile.subscription_tier as SubscriptionTier
  const limits = TIER_LIMITS[tier]
  const clientCount = (relationships || []).length
  const activeAssignmentCount = (assignments || []).filter(
    (a) => a.status === 'assigned' || a.status === 'in_progress'
  ).length

  // Build per-client assignment counts
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900">Clients</h1>
        <p className="mt-1 text-sm text-primary-500">
          Manage your clients and assign homework worksheets.
          Clients are identified by non-identifiable labels only — no personal data is stored.
        </p>
      </div>

      <ClientList
        relationships={(relationships || []) as TherapeuticRelationship[]}
        assignmentsByClient={assignmentsByClient}
        clientCount={clientCount}
        activeAssignmentCount={activeAssignmentCount}
        maxClients={limits.maxClients}
        maxActiveAssignments={limits.maxActiveAssignments}
        tier={tier}
      />
    </div>
  )
}
