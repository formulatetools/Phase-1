import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { ProfileForm } from '@/components/ui/profile-form'

export const metadata = {
  title: 'Settings — Formulate',
}

export default async function SettingsPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) redirect('/login')

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-primary-900">Settings</h1>

      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-primary-900">Profile</h2>
        <ProfileForm
          initialName={profile.full_name || ''}
          initialEmail={profile.email}
        />
      </div>
    </main>
  )
}
