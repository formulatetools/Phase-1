import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { BrandingConfigurator } from '@/components/admin/branding-configurator'
import { getBrandingConfig } from '@/lib/branding'

export const metadata = { title: 'Tools — Admin — Formulate' }

export default async function AdminToolsPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const config = await getBrandingConfig()

  return (
    <div>
      <AdminTabs />
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">PDF Branding</h2>
          <p className="text-sm text-primary-500">Configure watermark and branding for PDF exports. Changes apply immediately to all new PDF downloads.</p>
        </div>
        <BrandingConfigurator initialConfig={config} />
      </div>
    </div>
  )
}
