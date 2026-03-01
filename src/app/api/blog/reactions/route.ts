import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST — add "helpful" reaction
 * DELETE — remove "helpful" reaction
 *
 * The denormalized helpful_count is synced by counting actual reactions,
 * which avoids race conditions from concurrent read-modify-write cycles.
 */

async function syncHelpfulCount(postId: string) {
  const admin = createAdminClient()
  const { count } = await admin
    .from('blog_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  await admin
    .from('blog_posts')
    .update({ helpful_count: count ?? 0 })
    .eq('id', postId)
}

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

  await syncHelpfulCount(postId)

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

  await syncHelpfulCount(postId)

  return NextResponse.json({ ok: true })
}
