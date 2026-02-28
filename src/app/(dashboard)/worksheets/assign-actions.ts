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
