import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { TherapeuticRelationship, SubscriptionTier } from '@/types/database'
import { SuperviseeList } from '@/components/supervision/supervisee-list'

export const metadata = { title: 'Supervision — Formulate' }

export default async function SupervisionPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch all non-deleted supervision relationships
  const { data: relationships } = await supabase
    .from('therapeutic_relationships')
    .select('*')
    .eq('therapist_id', user.id)
    .eq('relationship_type', 'supervision')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })

  // Count active assignments per supervisee
  const relationshipIds = (relationships || []).map((r) => r.id)
  let assignments: { id: string; relationship_id: string; status: string }[] = []
  if (relationshipIds.length > 0) {
    const { data } = await supabase
      .from('worksheet_assignments')
      .select('id, relationship_id, status')
      .eq('therapist_id', user.id)
      .in('relationship_id', relationshipIds)
      .is('deleted_at', null)

    assignments = (data || []) as { id: string; relationship_id: string; status: string }[]
  }

  const tier = profile.subscription_tier as SubscriptionTier
  const limits = TIER_LIMITS[tier]
  const superviseeCount = (relationships || []).length

  // Build per-supervisee assignment counts
  const assignmentsByClient: Record<string, { active: number; completed: number; total: number }> = {}
  for (const a of assignments) {
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
        <h1 className="text-2xl font-bold text-primary-900">Supervision</h1>
        <p className="mt-1 text-sm text-primary-500">
          Manage your supervisees and assign structured supervision preparation worksheets.
        </p>
      </div>

      <SuperviseeList
        relationships={(relationships || []) as TherapeuticRelationship[]}
        assignmentsByClient={assignmentsByClient}
        superviseeCount={superviseeCount}
        maxSupervisees={limits.maxSupervisees}
        tier={tier}
      />
    </div>
  )
}
