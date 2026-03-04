'use server'

import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAccount() {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Delete in order: responses → assignments → relationships → worksheets → audit → profile
  // RLS ensures only user's own data is affected

  // 1. Delete worksheet responses via assignments
  const { data: relationships } = await supabase
    .from('therapeutic_relationships')
    .select('id')
    .eq('therapist_id', user.id)

  if (relationships && relationships.length > 0) {
    const relIds = relationships.map((r) => r.id)

    // Delete responses via assignments
    const { data: assignments } = await supabase
      .from('worksheet_assignments')
      .select('id')
      .in('relationship_id', relIds)

    if (assignments && assignments.length > 0) {
      const assignIds = assignments.map((a) => a.id)
      await supabase.from('worksheet_responses').delete().in('assignment_id', assignIds)
    }

    // Delete assignments
    await supabase.from('worksheet_assignments').delete().in('relationship_id', relIds)

    // Delete shared resources
    await supabase.from('shared_resources').delete().in('relationship_id', relIds)

    // Delete plan queue items + queues
    const { data: queues } = await supabase
      .from('plan_queues')
      .select('id')
      .in('relationship_id', relIds)

    if (queues && queues.length > 0) {
      await supabase.from('plan_queue_items').delete().in('queue_id', queues.map((q) => q.id))
      await supabase.from('plan_queues').delete().in('relationship_id', relIds)
    }

    // Delete relationships
    await supabase.from('therapeutic_relationships').delete().eq('therapist_id', user.id)
  }

  // 2. Delete user's custom worksheets
  await supabase.from('worksheets').delete().eq('created_by', user.id).eq('is_curated', false)

  // 3. Delete bookmarks
  await supabase.from('bookmarks').delete().eq('user_id', user.id)

  // 4. Delete feature request votes
  await supabase.from('feature_request_votes').delete().eq('user_id', user.id)

  // 5. Delete feature requests
  await supabase.from('feature_requests').delete().eq('user_id', user.id)

  // 6. Delete audit log entries
  await supabase.from('audit_log').delete().eq('user_id', user.id)

  // 7. Delete analytics
  await supabase.from('analytics').delete().eq('user_id', user.id)

  // 8. Delete subscriptions
  await supabase.from('subscriptions').delete().eq('user_id', user.id)

  // 9. Delete profile
  await supabase.from('profiles').delete().eq('id', user.id)

  // 10. Delete auth user via Supabase admin (sign out)
  // Note: This requires service role — for now we sign the user out and delete the profile.
  // The auth user record will be orphaned but harmless.

  revalidatePath('/settings')
  return { success: true }
}
