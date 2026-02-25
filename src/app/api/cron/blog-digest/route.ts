import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { blogDigestEmail } from '@/lib/email-templates'

/**
 * Weekly blog digest email.
 * Runs every Monday at 9 AM — sends new posts from the last 7 days
 * to users who opted in via blog_digest_opt_in.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Posts published in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, category, reading_time_minutes')
    .eq('status', 'published')
    .is('deleted_at', null)
    .gte('published_at', sevenDaysAgo)
    .order('published_at', { ascending: false })

  if (!recentPosts || recentPosts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_new_posts' })
  }

  const posts = recentPosts as Array<{
    title: string
    slug: string
    excerpt: string | null
    category: string
    reading_time_minutes: number | null
  }>

  // Find opted-in users
  const { data: optedInUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('blog_digest_opt_in', true)
    .is('deleted_at', null)

  if (!optedInUsers || optedInUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_opted_in_users' })
  }

  // Dedup: check who already received this week's digest
  const weekKey = new Date().toISOString().slice(0, 10) // e.g. "2026-02-25"
  const userIds = optedInUsers.map((u: { id: string }) => u.id)

  const { data: alreadySent } = await supabase
    .from('audit_log')
    .select('user_id')
    .in('user_id', userIds)
    .eq('entity_type', 'email')
    .eq('entity_id', `blog_digest_${weekKey}`)

  const sentSet = new Set((alreadySent ?? []).map((e: { user_id: string }) => e.user_id))

  let sent = 0

  for (const user of optedInUsers as Array<{ id: string; email: string; full_name: string | null }>) {
    if (sentSet.has(user.id)) continue

    const email = blogDigestEmail(user.full_name, posts)

    try {
      await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        emailType: 'blog_digest',
      })
    } catch (emailError) {
      console.error(`Failed to send blog digest to ${user.id}:`, emailError)
      continue
    }

    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create',
      entity_type: 'email',
      entity_id: `blog_digest_${weekKey}`,
      metadata: { template: 'blog_digest', post_count: posts.length },
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, candidates: optedInUsers.length, posts: posts.length })
}
