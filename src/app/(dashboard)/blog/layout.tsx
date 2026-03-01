import { getCurrentUser } from '@/lib/supabase/auth'
import { LandingNav } from '@/components/marketing/landing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getCurrentUser()

  // Authenticated users get the dashboard sidebar from the parent layout
  if (user) {
    return <>{children}</>
  }

  // Anonymous visitors get the marketing nav and footer
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  )
}
