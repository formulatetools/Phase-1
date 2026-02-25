'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { ContributorProfile } from '@/types/database'

interface Props {
  initialProfile: ContributorProfile | null
}

export function ContributorProfileForm({ initialProfile }: Props) {
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '')
  const [professionalTitle, setProfessionalTitle] = useState(initialProfile?.professional_title || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [profileUrl, setProfileUrl] = useState(initialProfile?.profile_url || '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      return
    }

    const contributorProfile: ContributorProfile = {
      display_name: displayName.trim(),
      professional_title: professionalTitle.trim(),
      bio: bio.trim(),
      profile_url: profileUrl.trim(),
    }

    const { error } = await supabase
      .from('profiles')
      .update({ contributor_profile: contributorProfile })
      .eq('id', user.id)

    if (error) {
      toast({ type: 'error', message: 'Failed to update contributor profile' })
    } else {
      toast({ type: 'success', message: 'Contributor profile updated' })
    }

    setSaving(false)
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-primary-700">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Dr Sarah Chen"
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-primary-400">How your name appears on attributed worksheets</p>
      </div>

      <div>
        <label htmlFor="professionalTitle" className="block text-sm font-medium text-primary-700">
          Professional Title <span className="text-red-500">*</span>
        </label>
        <input
          id="professionalTitle"
          type="text"
          value={professionalTitle}
          onChange={(e) => setProfessionalTitle(e.target.value)}
          placeholder="e.g. Clinical Psychologist"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-primary-700">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 300))}
          placeholder="Brief professional bio for your contributor profile"
          rows={3}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-primary-400">{bio.length}/300 characters</p>
      </div>

      <div>
        <label htmlFor="profileUrl" className="block text-sm font-medium text-primary-700">
          Professional Profile URL
        </label>
        <input
          id="profileUrl"
          type="url"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          placeholder="e.g. https://linkedin.com/in/sarahchen"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-primary-400">LinkedIn, university profile, etc. (optional)</p>
      </div>

      {/* Attribution preview */}
      {displayName.trim() && professionalTitle.trim() && (
        <div className="rounded-xl border border-dashed border-primary-200 px-4 py-3">
          <p className="text-xs font-medium text-primary-500 mb-1">Attribution Preview</p>
          <p className="text-sm text-primary-900">
            Contributed by <strong>{displayName.trim()}</strong>, {professionalTitle.trim()}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !displayName.trim() || !professionalTitle.trim()}
        className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-300 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Contributor Profile'}
      </button>
    </form>
  )
}
