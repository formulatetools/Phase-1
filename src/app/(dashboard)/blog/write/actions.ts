'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calculateReadingTime, generateSlug } from '@/lib/utils/blog'
import type { ContributorRoles, BlogPostStatus } from '@/types/database'

type ActionResult = { success: boolean; error?: string; postId?: string }

function hasContributorRole(roles: ContributorRoles | null): boolean {
  return !!(roles?.clinical_contributor || roles?.clinical_reviewer || roles?.content_writer)
}

// ── Save Draft ────────────────────────────────────────────────────────

export async function saveBlogDraft(formData: {
  title: string
  excerpt: string
  category: string
  tags: string[]
  content: Record<string, unknown>
  coverImageUrl: string | null
  relatedWorksheetIds: string[]
}): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!hasContributorRole(roles)) redirect('/dashboard')

  if (!formData.title.trim()) {
    return { success: false, error: 'Title is required' }
  }

  const admin = createAdminClient()
  const supabase = await createClient()

  const slug = generateSlug(formData.title)
  const readingTime = calculateReadingTime(formData.content)

  const { data, error } = await admin
    .from('blog_posts')
    .insert({
      author_id: user.id,
      title: formData.title.trim(),
      slug,
      excerpt: formData.excerpt.trim() || null,
      category: formData.category,
      tags: formData.tags,
      content: formData.content,
      cover_image_url: formData.coverImageUrl,
      related_worksheet_ids: formData.relatedWorksheetIds,
      reading_time_minutes: readingTime,
      status: 'draft' as BlogPostStatus,
    })
    .select('id')
    .single()

  if (error) {
    // Handle unique slug conflict
    if (error.code === '23505' && error.message.includes('slug')) {
      return { success: false, error: 'A post with a similar title already exists. Please use a different title.' }
    }
    console.error('Save draft error:', error)
    return { success: false, error: 'Failed to save draft' }
  }

  const post = data as { id: string }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'blog_post',
    entity_id: post.id,
    metadata: { title: formData.title, status: 'draft' },
  })

  revalidatePath('/blog/write')
  revalidatePath('/dashboard')

  return { success: true, postId: post.id }
}

// ── Update Draft ──────────────────────────────────────────────────────

export async function updateBlogDraft(
  postId: string,
  formData: {
    title: string
    excerpt: string
    category: string
    tags: string[]
    content: Record<string, unknown>
    coverImageUrl: string | null
    relatedWorksheetIds: string[]
  }
): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!hasContributorRole(roles)) redirect('/dashboard')

  if (!formData.title.trim()) {
    return { success: false, error: 'Title is required' }
  }

  const admin = createAdminClient()

  // Verify ownership and status allows editing
  const { data: existing } = await admin
    .from('blog_posts')
    .select('id, author_id, status')
    .eq('id', postId)
    .is('deleted_at', null)
    .single()

  if (!existing) return { success: false, error: 'Post not found' }

  const post = existing as { id: string; author_id: string; status: string }
  if (post.author_id !== user.id) return { success: false, error: 'Not authorised' }
  if (post.status === 'published') return { success: false, error: 'Cannot edit a published post' }

  const readingTime = calculateReadingTime(formData.content)

  const { error } = await admin
    .from('blog_posts')
    .update({
      title: formData.title.trim(),
      slug: generateSlug(formData.title),
      excerpt: formData.excerpt.trim() || null,
      category: formData.category,
      tags: formData.tags,
      content: formData.content,
      cover_image_url: formData.coverImageUrl,
      related_worksheet_ids: formData.relatedWorksheetIds,
      reading_time_minutes: readingTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) {
    if (error.code === '23505' && error.message.includes('slug')) {
      return { success: false, error: 'A post with a similar title already exists.' }
    }
    console.error('Update draft error:', error)
    return { success: false, error: 'Failed to save' }
  }

  revalidatePath('/blog/write')
  revalidatePath(`/blog/write/${postId}`)
  revalidatePath('/dashboard')

  return { success: true, postId }
}

// ── Submit for Review ─────────────────────────────────────────────────

export async function submitBlogPost(postId: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!hasContributorRole(roles)) redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: existing } = await admin
    .from('blog_posts')
    .select('id, author_id, status, title, content')
    .eq('id', postId)
    .is('deleted_at', null)
    .single()

  if (!existing) return { success: false, error: 'Post not found' }

  const post = existing as { id: string; author_id: string; status: string; title: string; content: Record<string, unknown> }
  if (post.author_id !== user.id) return { success: false, error: 'Not authorised' }
  if (!['draft', 'changes_requested'].includes(post.status)) {
    return { success: false, error: 'Post cannot be submitted in its current state' }
  }

  // Basic validation
  const readingTime = calculateReadingTime(post.content)
  if (readingTime < 1) {
    return { success: false, error: 'Post content is too short to submit' }
  }

  await admin
    .from('blog_posts')
    .update({
      status: 'submitted' as BlogPostStatus,
      submitted_at: new Date().toISOString(),
      admin_feedback: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'blog_post',
    entity_id: postId,
    metadata: { title: post.title, status: 'submitted' },
  })

  revalidatePath('/blog/write')
  revalidatePath(`/blog/write/${postId}`)
  revalidatePath('/admin/blog')
  revalidatePath('/dashboard')

  return { success: true }
}
