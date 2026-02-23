import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { promoExpiryEmail } from '@/lib/email-templates'

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  standard: 'Practice',
  professional: 'Specialist',
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel injects this for scheduled crons)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find promo redemptions expiring in ~3 days (2.5–3.5 day window)
  const windowStart = new Date(Date.now() + 2.5 * 86_400_000).toISOString()
  const windowEnd = new Date(Date.now() + 3.5 * 86_400_000).toISOString()

  const { data: expiring } = await supabase
    .from('promo_redemptions')
    .select('user_id, access_expires_at, promo_code_id')
    .gt('access_expires_at', windowStart)
    .lt('access_expires_at', windowEnd)

  let sent = 0

  for (const redemption of expiring ?? []) {
    // Check if we already sent this warning (dedup via audit_log)
    const { data: alreadySent } = await supabase
      .from('audit_log')
      .select('id')
      .eq('user_id', redemption.user_id)
      .eq('entity_type', 'email')
      .eq('entity_id', 'promo_expiry_warning')
      .limit(1)
      .maybeSingle()

    if (alreadySent) continue

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', redemption.user_id)
      .single()

    if (!profile?.email) continue

    // Get promo code tier
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('tier')
      .eq('id', redemption.promo_code_id)
      .single()

    const tierLabel = TIER_LABELS[promoCode?.tier ?? 'starter'] || 'Starter'

    // Send promo expiry warning email
    const email = promoExpiryEmail(
      profile.full_name as string | null,
      tierLabel,
      redemption.access_expires_at
    )
    sendEmail({ to: profile.email, subject: email.subject, html: email.html, emailType: 'promo_expiry' })

    // Log to audit_log for dedup
    await supabase.from('audit_log').insert({
      user_id: redemption.user_id,
      action: 'create',
      entity_type: 'email',
      entity_id: 'promo_expiry_warning',
      metadata: {
        template: 'promo_expiry_warning',
        expires_at: redemption.access_expires_at,
      },
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, expiring: expiring?.length ?? 0 })
}
