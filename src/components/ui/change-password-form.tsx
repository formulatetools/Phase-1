'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      toast({ type: 'error', message: 'Password must be at least 8 characters' })
      return
    }

    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast({ type: 'error', message: error.message })
    } else {
      toast({ type: 'success', message: 'Password updated' })
      setNewPassword('')
      setConfirmPassword('')
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-primary-700">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          placeholder="Minimum 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-primary-700">
          Confirm Password
        </label>
        <input
          id="confirmNewPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          placeholder="Re-enter your new password"
        />
      </div>

      <Button
        type="submit"
        disabled={saving}
      >
        {saving ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  )
}
