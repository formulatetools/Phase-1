'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BlogDigestToggleProps {
  initialValue: boolean
}

export function BlogDigestToggle({ initialValue }: BlogDigestToggleProps) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)

    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ blog_digest_opt_in: next })
        .eq('id', user.id)

      if (error) {
        console.error('Failed to update blog digest preference:', error)
        setEnabled(!next) // revert on error
      }
    })
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-primary-700">Weekly Blog Digest</p>
        <p className="text-xs text-primary-400">
          Receive a weekly email with new blog posts and articles
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${
          enabled ? 'bg-brand' : 'bg-primary-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
