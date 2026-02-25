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

  const expiringList = expiring ?? []
  if (expiringList.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, expiring: 0 })
  }

  const userIds = [...new Set(expiringList.map((r) => r.user_id))]
  const promoCodeIds = [...new Set(expiringList.map((r) => r.promo_code_id))]

  // Batch: pre-fetch dedup records
  const { data: sentEmails } = await supabase
    .from('audit_log')
    .select('user_id')
    .in('user_id', userIds)
    .eq('entity_type', 'email')
    .eq('entity_id', 'promo_expiry_warning')

  const sentSet = new Set((sentEmails ?? []).map((e) => e.user_id))

  // Batch: pre-fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Batch: pre-fetch all promo codes
  const { data: promoCodes } = await supabase
    .from('promo_codes')
    .select('id, tier')
    .in('id', promoCodeIds)

  const promoCodeMap = new Map((promoCodes ?? []).map((p) => [p.id, p]))

  let sent = 0

  for (const redemption of expiringList) {
    if (sentSet.has(redemption.user_id)) continue

    const profile = profileMap.get(redemption.user_id)
    if (!profile?.email) continue

    const promoCode = promoCodeMap.get(redemption.promo_code_id)
    const tierLabel = TIER_LABELS[promoCode?.tier ?? 'starter'] || 'Starter'

    // Send promo expiry warning email
    const email = promoExpiryEmail(
      profile.full_name as string | null,
      tierLabel,
      redemption.access_expires_at
    )
    try {
      await sendEmail({ to: profile.email, subject: email.subject, html: email.html, emailType: 'promo_expiry' })
    } catch (emailError) {
      console.error(`Failed to send promo expiry email to ${redemption.user_id}:`, emailError)
      continue
    }

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
