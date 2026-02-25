import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { engagementEmail } from '@/lib/email-templates'

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel injects this for scheduled crons)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find users who signed up 3–10 days ago
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString()
  const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString()

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .lt('created_at', threeDaysAgo)
    .gt('created_at', tenDaysAgo)

  const candidateIds = (candidates ?? []).map((u) => u.id)
  if (candidateIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, candidates: 0 })
  }

  // Batch: pre-fetch all dedup records
  const { data: sentEmails } = await supabase
    .from('audit_log')
    .select('user_id')
    .in('user_id', candidateIds)
    .eq('entity_type', 'email')
    .eq('entity_id', 'engagement_nudge')

  const sentSet = new Set((sentEmails ?? []).map((e) => e.user_id))

  // Batch: pre-fetch all users with worksheet activity
  const { data: activeUsers } = await supabase
    .from('worksheet_access_log')
    .select('user_id')
    .in('user_id', candidateIds)
    .in('access_type', ['interact', 'export'])

  const activeSet = new Set((activeUsers ?? []).map((u) => u.user_id))

  let sent = 0

  for (const user of candidates ?? []) {
    if (sentSet.has(user.id) || activeSet.has(user.id)) continue

    // Send engagement email
    const email = engagementEmail(user.full_name as string | null)
    try {
      await sendEmail({ to: user.email, subject: email.subject, html: email.html, emailType: 'engagement' })
    } catch (emailError) {
      console.error(`Failed to send engagement email to ${user.id}:`, emailError)
      continue
    }

    // Log to audit_log for dedup
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'email',
      entity_id: 'engagement_nudge',
      metadata: { template: 'engagement_nudge' },
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, candidates: candidates?.length ?? 0 })
}
