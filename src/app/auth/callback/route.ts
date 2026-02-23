import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email-templates'

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
          sendEmail({ to: user.email, subject: email.subject, html: email.html })
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
