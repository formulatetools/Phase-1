import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { SidebarNav } from '@/components/ui/sidebar-nav'

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

  return (
    <div className="min-h-screen bg-primary-50/50">
      <SidebarNav
        userEmail={profile.email}
        userName={profile.full_name}
        tier={profile.subscription_tier}
        role={profile.role}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
