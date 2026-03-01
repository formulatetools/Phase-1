import { LandingNav } from '@/components/marketing/landing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  )
}
