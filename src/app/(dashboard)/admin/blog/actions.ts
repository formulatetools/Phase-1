'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { blogPostStatusEmail } from '@/lib/email-templates'
import type { BlogPostStatus } from '@/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

type ActionResult = { success: boolean; error?: string }

// ── Update Blog Post Status (Admin) ──────────────────────────────────

export async function updateBlogPostStatus(
  postId: string,
  status: BlogPostStatus,
  feedback?: string
): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: existing } = await admin
    .from('blog_posts')
    .select('id, title, slug, author_id, status')
    .eq('id', postId)
    .is('deleted_at', null)
    .single()

  if (!existing) return { success: false, error: 'Post not found' }

  const post = existing as { id: string; title: string; slug: string; author_id: string; status: string }

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (feedback !== undefined) {
    updateData.admin_feedback = feedback
  }

  if (status === 'published') {
    updateData.published_at = new Date().toISOString()
    updateData.published_by = user.id
  }

  const { error } = await admin
    .from('blog_posts')
    .update(updateData)
    .eq('id', postId)

  if (error) {
    console.error('Update blog status error:', error)
    return { success: false, error: 'Failed to update status' }
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'blog_post',
    entity_id: postId,
    metadata: {
      title: post.title,
      previous_status: post.status,
      new_status: status,
      feedback: feedback || null,
    },
  })

  // Send email notification to the blog post author
  const emailStatuses: BlogPostStatus[] = ['approved', 'changes_requested', 'published', 'rejected']
  if (emailStatuses.includes(status)) {
    const { data: author } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', post.author_id)
      .single()

    if (author) {
      const a = author as { email: string; full_name: string | null }
      const postUrl = status === 'published' ? `${APP_URL}/blog/${post.slug}` : undefined
      const emailStatus = status as 'approved' | 'changes_requested' | 'published' | 'rejected'
      const email = blogPostStatusEmail(a.full_name, post.title, emailStatus, feedback, postUrl)
      try {
        await sendEmail({ to: a.email, subject: email.subject, html: email.html, emailType: `blog_${status}` })
      } catch (emailError) {
        console.error('Failed to send blog status email:', emailError)
      }
    }
  }

  revalidatePath('/admin/blog')
  revalidatePath(`/admin/blog/${postId}`)
  revalidatePath('/blog')
  revalidatePath('/blog/write')
  revalidatePath('/dashboard')

  // Revalidate the public post page if publishing
  if (status === 'published') {
    revalidatePath(`/blog/${post.slug}`)
  }

  return { success: true }
}
