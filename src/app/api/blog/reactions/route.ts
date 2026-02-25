import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST — add "helpful" reaction
 * DELETE — remove "helpful" reaction
 */

export async function POST(request: Request) {
  const { user } = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await request.json()
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Insert reaction (unique constraint prevents duplicates)
  const { error } = await supabase
    .from('blog_reactions')
    .insert({ post_id: postId, user_id: user.id })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already reacted' }, { status: 409 })
    }
    console.error('Reaction insert error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  // Increment denormalized count
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('helpful_count')
    .eq('id', postId)
    .single()

  if (post) {
    await admin
      .from('blog_posts')
      .update({ helpful_count: ((post as { helpful_count: number }).helpful_count || 0) + 1 })
      .eq('id', postId)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { user } = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await request.json()
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Reaction delete error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  // Decrement denormalized count
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('helpful_count')
    .eq('id', postId)
    .single()

  if (post) {
    const current = (post as { helpful_count: number }).helpful_count || 0
    await admin
      .from('blog_posts')
      .update({ helpful_count: Math.max(0, current - 1) })
      .eq('id', postId)
  }

  return NextResponse.json({ ok: true })
}
