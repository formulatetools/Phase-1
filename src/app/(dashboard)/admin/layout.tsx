import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'

/**
 * Admin layout guard — defence in depth.
 * Individual admin pages also check role, but this layout ensures
 * no admin route is accidentally exposed without an auth check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
