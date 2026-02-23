'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding() {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true } as Record<string, unknown>)
    .eq('id', user.id)

  // Gracefully handle if column doesn't exist yet (migration pending)
  if (error && !error.message.includes('onboarding_completed')) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
