import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Admin client with service role key — bypasses RLS.
// Use ONLY in server-side contexts (API routes, webhooks, server actions).
// NEVER expose this client or key to the browser.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
