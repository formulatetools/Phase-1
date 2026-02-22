'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'

export async function createWorksheet(formData: FormData) {
  const { profile } = await getCurrentUser()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const instructions = formData.get('instructions') as string
  const categoryId = formData.get('category_id') as string
  const isPremium = formData.get('is_premium') === 'true'
  const isPublished = formData.get('is_published') === 'true'
  const tagsRaw = formData.get('tags') as string
  const estimatedMinutes = formData.get('estimated_minutes') as string
  const schemaJson = formData.get('schema') as string

  let schema
  try {
    schema = JSON.parse(schemaJson || '{"version":1,"sections":[]}')
  } catch {
    schema = { version: 1, sections: [] }
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const { error } = await supabase.from('worksheets').insert({
    title,
    slug,
    description: description || '',
    instructions: instructions || '',
    category_id: categoryId,
    is_premium: isPremium,
    is_published: isPublished,
    tags,
    estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
    schema,
  })

  if (error) {
    return { error: error.message }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: profile.id,
    action: 'create',
    entity_type: 'worksheet',
    entity_id: slug,
    metadata: { title },
  })

  redirect('/admin')
}

export async function updateWorksheet(worksheetId: string, formData: FormData) {
  const { profile } = await getCurrentUser()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const instructions = formData.get('instructions') as string
  const categoryId = formData.get('category_id') as string
  const isPremium = formData.get('is_premium') === 'true'
  const isPublished = formData.get('is_published') === 'true'
  const tagsRaw = formData.get('tags') as string
  const estimatedMinutes = formData.get('estimated_minutes') as string
  const schemaJson = formData.get('schema') as string

  let schema
  try {
    schema = JSON.parse(schemaJson || '{"version":1,"sections":[]}')
  } catch {
    schema = { version: 1, sections: [] }
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .from('worksheets')
    .update({
      title,
      slug,
      description: description || '',
      instructions: instructions || '',
      category_id: categoryId,
      is_premium: isPremium,
      is_published: isPublished,
      tags,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      schema,
    })
    .eq('id', worksheetId)

  if (error) {
    return { error: error.message }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: profile.id,
    action: 'update',
    entity_type: 'worksheet',
    entity_id: worksheetId,
    metadata: { title },
  })

  redirect('/admin')
}
