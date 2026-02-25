'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ContributorRoles } from '@/types/database'

// ── Claim Content ────────────────────────────────────────────────────

export async function claimContent(worksheetId: string): Promise<void> {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  // Verify content_writer role
  const roles = profile.contributor_roles as ContributorRoles | null
  if (!roles?.content_writer) redirect('/dashboard')

  const admin = createAdminClient()
  const supabase = await createClient()

  // Validate worksheet is published, has no clinical_context, and is unclaimed
  const { data: worksheet } = await admin
    .from('worksheets')
    .select('id, title, clinical_context, clinical_context_status')
    .eq('id', worksheetId)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single()

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; clinical_context: string | null; clinical_context_status: string | null }

  // Only allow claiming if no context exists and not already claimed
  if (ws.clinical_context || ws.clinical_context_status) return

  await admin
    .from('worksheets')
    .update({
      clinical_context_status: 'claimed',
      clinical_context_author: user.id,
    })
    .eq('id', worksheetId)

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'clinical_context',
    entity_id: worksheetId,
    metadata: { status: 'claimed', title: ws.title },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/content/${worksheetId}`)
}

// ── Submit Content ───────────────────────────────────────────────────

export async function submitContent(worksheetId: string, clinicalContext: string): Promise<void> {
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

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; clinical_context_author: string | null; clinical_context_status: string | null }
  if (ws.clinical_context_author !== user.id) return
  if (!['claimed', 'rejected'].includes(ws.clinical_context_status || '')) return

  // Validate word count (150–250 words)
  const wordCount = clinicalContext.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 150 || wordCount > 250) return

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
}

// ── Unclaim Content ──────────────────────────────────────────────────

export async function unclaimContent(worksheetId: string): Promise<void> {
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

  if (!worksheet) return

  const ws = worksheet as { id: string; title: string; clinical_context_author: string | null; clinical_context_status: string | null }
  if (ws.clinical_context_author !== user.id) return
  if (ws.clinical_context_status !== 'claimed') return

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
}
