'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'

/**
 * Fetch active relationships for the current therapist,
 * filtered by relationship type (clinical or supervision).
 * Used by the "Assign from Library" modal.
 */
export async function getAssignableRelationships(
  relationshipType: 'clinical' | 'supervision'
) {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated', data: [] }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label, relationship_type, status')
    .eq('therapist_id', user.id)
    .eq('relationship_type', relationshipType)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('client_label')

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

/**
 * Fetch worksheets the current therapist can assign as homework.
 * Returns two groups: custom tools (user-created) and curated library.
 * Each worksheet includes an `assignCount` for popularity sorting.
 * Used by the unified "Assign Homework" modal.
 */
export async function getAssignableWorksheets() {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated', data: { custom: [], library: [] } }

  const supabase = await createClient()

  // Fetch worksheets + assignment counts in parallel
  const [wsResult, countResult] = await Promise.all([
    supabase
      .from('worksheets')
      .select('id, title, tags, is_curated')
      .or(
        `and(is_published.eq.true,is_curated.eq.true),and(created_by.eq.${user.id},is_curated.eq.false)`
      )
      .is('deleted_at', null)
      .order('title'),
    supabase
      .from('worksheet_assignments')
      .select('worksheet_id')
      .eq('therapist_id', user.id)
      .is('deleted_at', null),
  ])

  if (wsResult.error) return { error: wsResult.error.message, data: { custom: [], library: [] } }

  // Build popularity count map
  const countMap = new Map<string, number>()
  countResult.data?.forEach((a: { worksheet_id: string }) => {
    countMap.set(a.worksheet_id, (countMap.get(a.worksheet_id) || 0) + 1)
  })

  // Attach counts and sort by popularity (desc), then title (asc)
  const all = (wsResult.data || []).map((w) => ({
    ...w,
    assignCount: countMap.get(w.id) || 0,
  }))

  const sortByPopularity = (
    a: { assignCount: number; title: string },
    b: { assignCount: number; title: string }
  ) => b.assignCount - a.assignCount || a.title.localeCompare(b.title)

  return {
    data: {
      custom: all.filter((w) => !w.is_curated).sort(sortByPopularity),
      library: all.filter((w) => w.is_curated).sort(sortByPopularity),
    },
  }
}
