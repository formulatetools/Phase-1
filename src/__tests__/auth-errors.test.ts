import { describe, it, expect } from 'vitest'
import { friendlyAuthError } from '@/lib/utils/auth-errors'

describe('friendlyAuthError', () => {
  it('maps rate limit errors to a friendly message', () => {
    expect(friendlyAuthError('Rate limit exceeded')).toBe(
      'Our email provider is temporarily busy. Please wait a minute and try again.'
    )
  })

  it('handles rate limit errors case-insensitively', () => {
    expect(friendlyAuthError('Email rate limit reached for this project')).toBe(
      'Our email provider is temporarily busy. Please wait a minute and try again.'
    )
  })

  it('maps "email not confirmed" errors', () => {
    expect(friendlyAuthError('Email not confirmed')).toBe(
      'Please check your email for a confirmation link before signing in.'
    )
  })

  it('maps invalid login credentials', () => {
    expect(friendlyAuthError('Invalid login credentials')).toBe(
      'Incorrect email or password. Please try again.'
    )
  })

  it('maps user already registered', () => {
    expect(friendlyAuthError('User already registered')).toBe(
      'An account with this email already exists. Try signing in instead.'
    )
  })

  it('passes through password requirement messages unchanged', () => {
    const msg = 'Password should be at least 8 characters'
    expect(friendlyAuthError(msg)).toBe(msg)
  })

  it('passes through unknown errors unchanged', () => {
    const msg = 'Some completely unknown error'
    expect(friendlyAuthError(msg)).toBe(msg)
  })

  it('handles empty string', () => {
    expect(friendlyAuthError('')).toBe('')
  })
})
