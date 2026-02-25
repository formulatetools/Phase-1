import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { freeResetEmail } from '@/lib/email-templates'

// Runs on the 1st of each month at 9 AM.
// Sends "your 5 free uses have reset" to free-tier users who
// actually used at least 1 worksheet last month (no point emailing
// someone who never used the product).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find free-tier users
  const { data: freeUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name, monthly_download_count')
    .eq('subscription_tier', 'free')

  if (!freeUsers || freeUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: 0 })
  }

  // Only email users who actually used at least 1 worksheet last month
  const activeUsers = freeUsers.filter(
    (u) => (u.monthly_download_count ?? 0) > 0
  )

  if (activeUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: freeUsers.length })
  }

  // Dedup: check who already received this email this month
  const activeIds = activeUsers.map((u) => u.id)
  const monthKey = new Date().toISOString().slice(0, 7) // e.g. "2026-02"

  const { data: alreadySent } = await supabase
    .from('audit_log')
    .select('user_id')
    .in('user_id', activeIds)
    .eq('entity_type', 'email')
    .eq('entity_id', `free_reset_${monthKey}`)

  const sentSet = new Set((alreadySent ?? []).map((e) => e.user_id))

  let sent = 0

  for (const user of activeUsers) {
    if (sentSet.has(user.id)) continue

    const email = freeResetEmail(user.full_name as string | null)

    try {
      await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        emailType: 'free_reset',
      })
    } catch (emailError) {
      console.error(`Failed to send free reset email to ${user.id}:`, emailError)
      continue
    }

    // Log for dedup (keyed by month so it only blocks re-sends within the same month)
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'email',
      entity_id: `free_reset_${monthKey}`,
      metadata: { template: 'free_reset', month: monthKey },
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, candidates: activeUsers.length })
}
