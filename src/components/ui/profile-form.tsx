'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialName: string
  initialEmail: string
}

export function ProfileForm({ initialName, initialEmail }: Props) {
  const [fullName, setFullName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      setMessage('Failed to update profile.')
    } else {
      setMessage('Profile updated.')
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-primary-700">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-700">
          Email
        </label>
        <p className="mt-1 text-sm text-primary-500">{initialEmail}</p>
      </div>

      {message && (
        <p className="text-sm text-brand-text">{message}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
