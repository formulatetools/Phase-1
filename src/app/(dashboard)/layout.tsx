import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { AssignProvider } from '@/components/providers/assign-provider'
import { KeyboardShortcutsProvider } from '@/components/providers/keyboard-shortcuts-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getCurrentUser()

  // Worksheets are publicly browsable, so we only show the sidebar for authenticated users
  const isAuthenticated = !!user && !!profile

  if (!isAuthenticated) {
    // Let individual pages handle unauthenticated state (e.g., worksheets are public)
    return <>{children}</>
  }

  // Fetch sidebar data in parallel — lightweight head-only count queries
  const supabase = await createClient()
  const [{ count: pendingReviewCount }, { count: activeSuperviseeCount }] =
    await Promise.all([
      supabase
        .from('worksheet_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .eq('status', 'completed')
        .is('deleted_at', null),
      supabase
        .from('therapeutic_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', user.id)
        .eq('relationship_type', 'supervision')
        .eq('status', 'active')
        .is('deleted_at', null),
    ])

  return (
    <AssignProvider>
    <KeyboardShortcutsProvider>
      <div className="min-h-screen bg-primary-50/50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary-800 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-brand"
        >
          Skip to main content
        </a>

        <SidebarNav
          userEmail={profile.email}
          userName={profile.full_name}
          tier={profile.subscription_tier}
          role={profile.role}
          pendingReviewCount={pendingReviewCount ?? 0}
          hasSupervisees={(activeSuperviseeCount ?? 0) > 0}
        />

        {/* Main content area — offset by sidebar width on desktop */}
        <div className="md:pl-64">
          <main id="main-content" className="min-h-screen pb-20 md:pb-0 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </KeyboardShortcutsProvider>
    </AssignProvider>
  )
}
