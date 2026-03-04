/** Map raw Supabase auth errors to user-friendly messages */
export function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('rate') && lower.includes('limit')) {
    return 'Our email provider is temporarily busy. Please wait a minute and try again.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email for a confirmation link before signing in.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lower.includes('password') && lower.includes('least')) {
    return raw // Keep Supabase's password requirement message as-is
  }
  return raw
}
