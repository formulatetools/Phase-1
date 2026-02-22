import type { User } from '@supabase/supabase-js'
import { createClient } from './server'
import type { Profile } from '@/types/database'

// Server-side: get current user and profile
export async function getCurrentUser(): Promise<{
  user: User | null
  profile: Profile | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile: profile as Profile | null }
}
