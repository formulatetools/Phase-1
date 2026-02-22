'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'signup'
type AuthMethod = 'password' | 'magic-link'

interface AuthFormProps {
  mode: AuthMode
  redirectTo?: string
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [method, setMethod] = useState<AuthMethod>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo || '/dashboard'}`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = redirectTo || '/dashboard'
      }
    }

    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo || '/dashboard'}`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a magic link to sign in.')
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      {/* Method toggle */}
      <div className="mb-6 flex rounded-lg bg-primary-100 p-1">
        <button
          type="button"
          onClick={() => setMethod('password')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            method === 'password'
              ? 'bg-white text-primary-900 shadow-sm'
              : 'text-primary-500 hover:text-primary-700'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMethod('magic-link')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            method === 'magic-link'
              ? 'bg-white text-primary-900 shadow-sm'
              : 'text-primary-500 hover:text-primary-700'
          }`}
        >
          Magic Link
        </button>
      </div>

      <form
        onSubmit={method === 'password' ? handlePasswordAuth : handleMagicLink}
        className="space-y-4"
      >
        {mode === 'signup' && method === 'password' && (
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-primary-700"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-primary-900 placeholder-primary-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              placeholder="Dr. Jane Smith"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-primary-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-primary-900 placeholder-primary-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            placeholder="you@example.com"
          />
        </div>

        {method === 'password' && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-primary-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-primary-900 placeholder-primary-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              placeholder="Minimum 8 characters"
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Please wait...'
            : method === 'magic-link'
              ? 'Send Magic Link'
              : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
