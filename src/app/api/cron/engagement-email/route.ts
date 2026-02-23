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

  let sent = 0

  for (const user of candidates ?? []) {
    // Check if we already sent this email (dedup via audit_log)
    const { data: alreadySent } = await supabase
      .from('audit_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', 'email')
      .eq('entity_id', 'engagement_nudge')
      .limit(1)
      .maybeSingle()

    if (alreadySent) continue

    // Check if user has any worksheet usage
    const { count } = await supabase
      .from('worksheet_access_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('access_type', ['interact', 'export'])

    if ((count ?? 0) > 0) continue

    // Send engagement email
    const email = engagementEmail(user.full_name as string | null)
    sendEmail({ to: user.email, subject: email.subject, html: email.html, emailType: 'engagement' })

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
