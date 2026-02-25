'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ContributorRoles } from '@/types/database'
import { CONTENT_WORD_MIN, CONTENT_WORD_MAX } from './constants'

type ActionResult = { success: boolean; error?: string }

// ── Claim Content ────────────────────────────────────────────────────

export async function claimContent(worksheetId: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  // Verify content_writer role
  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.content_writer) redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Atomic claim — single UPDATE with all preconditions in WHERE clause
  // Eliminates race condition where two writers could claim simultaneously
  const { data, error } = await admin
    .from('worksheets')
    .update({
      clinical_context_status: 'claimed',
      clinical_context_author: user.id,
    })
    .eq('id', worksheetId)
    .eq('is_published', true)
    .is('clinical_context', null)
    .is('clinical_context_status', null)
    .is('deleted_at', null)
    .select('id, title')
    .single()

  if (error || !data) {
    return { success: false, error: 'This worksheet has already been claimed or is unavailable' }
  }

  const ws = data as { id: string; title: string }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'clinical_context',
    entity_id: worksheetId,
    metadata: { status: 'claimed', title: ws.title },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/content/${worksheetId}`)

  return { success: true }
}

// ── Submit Content ───────────────────────────────────────────────────

export async function submitContent(worksheetId: string, clinicalContext: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.content_writer) redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Verify user is the author and status allows submission
  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, clinical_context_author, clinical_context_status')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return { success: false, error: 'Worksheet not found' }

  const ws = worksheet as { id: string; title: string; clinical_context_author: string | null; clinical_context_status: string | null }
  if (ws.clinical_context_author !== user.id) return { success: false, error: 'Not authorised' }
  if (!['claimed', 'rejected'].includes(ws.clinical_context_status || '')) return { success: false, error: 'Cannot submit in current state' }

  // Validate word count
  const wordCount = clinicalContext.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < CONTENT_WORD_MIN || wordCount > CONTENT_WORD_MAX) {
    return { success: false, error: `Word count must be ${CONTENT_WORD_MIN}–${CONTENT_WORD_MAX}` }
  }

  await admin
    .from('worksheets')
    .update({
      clinical_context: clinicalContext.trim(),
      clinical_context_status: 'submitted',
      clinical_context_feedback: null,
    })
    .eq('id', worksheetId)

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'clinical_context',
    entity_id: worksheetId,
    metadata: { status: 'submitted', title: ws.title, word_count: wordCount },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/content/${worksheetId}`)
  revalidatePath('/admin/content')

  return { success: true }
}

// ── Unclaim Content ──────────────────────────────────────────────────

export async function unclaimContent(worksheetId: string): Promise<ActionResult> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.content_writer) redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Verify user is the author and status is 'claimed'
  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, clinical_context_author, clinical_context_status')
    .eq('id', worksheetId)
    .single()

  if (!worksheet) return { success: false, error: 'Worksheet not found' }

  const ws = worksheet as { id: string; title: string; clinical_context_author: string | null; clinical_context_status: string | null }
  if (ws.clinical_context_author !== user.id) return { success: false, error: 'Not authorised' }
  if (ws.clinical_context_status !== 'claimed') return { success: false, error: 'Can only unclaim a claimed worksheet' }

  await admin
    .from('worksheets')
    .update({
      clinical_context_author: null,
      clinical_context_status: null,
      clinical_context: null,
    })
    .eq('id', worksheetId)

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'clinical_context',
    entity_id: worksheetId,
    metadata: { status: 'unclaimed', title: ws.title },
  })

  revalidatePath('/dashboard')

  return { success: true }
}
