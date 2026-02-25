import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email-templates'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Send welcome email on first login (fire-and-forget — don't block redirect)
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, full_name')
          .eq('id', user.id)
          .single()

        if (profile && !profile.onboarding_completed) {
          const email = welcomeEmail(profile.full_name as string | null)
          sendEmail({ to: user.email, subject: email.subject, html: email.html, emailType: 'welcome' })

          // Record terms/privacy acceptance from signup metadata
          const acceptedTermsAt = user.user_metadata?.accepted_terms_at as string | undefined
          const acceptedPrivacyAt = user.user_metadata?.accepted_privacy_at as string | undefined
          if (acceptedTermsAt || acceptedPrivacyAt) {
            await supabase
              .from('profiles')
              .update({
                ...(acceptedTermsAt ? { terms_accepted_at: acceptedTermsAt } : {}),
                ...(acceptedPrivacyAt ? { privacy_accepted_at: acceptedPrivacyAt } : {}),
              })
              .eq('id', user.id)
          }

          // Track referral if user signed up via referral link (fire-and-forget)
          const referralCode = user.user_metadata?.referral_code as string | undefined
          if (referralCode) {
            try {
              const admin = createAdminClient()
              const { data: refCode } = await admin
                .from('referral_codes')
                .select('id, user_id')
                .eq('code', referralCode.toUpperCase())
                .single()

              if (refCode && refCode.user_id !== user.id) {
                await admin.from('referrals').insert({
                  referrer_id: refCode.user_id,
                  referee_id: user.id,
                  referral_code_id: refCode.id,
                  status: 'pending',
                })
              }
            } catch {
              // Don't block redirect on referral tracking failure
              console.error('[referral] Failed to track referral')
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
