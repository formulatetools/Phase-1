import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { WorkspaceTemplate, Worksheet } from '@/types/database'
import { TemplatePreview } from '@/components/templates/template-preview'

export const metadata = {
  title: 'Preview Homework Plan — Formulate',
}

interface PageProps {
  params: Promise<{ templateId: string }>
}

export default async function TemplatePreviewPage({ params }: PageProps) {
  const { templateId } = await params
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch template (ownership verified by therapist_id filter)
  const { data: template } = await supabase
    .from('workspace_templates')
    .select('*')
    .eq('id', templateId)
    .eq('therapist_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!template) notFound()
  const typedTemplate = template as WorkspaceTemplate

  // Fetch worksheets for assignment specs (need full schema for rendering)
  const worksheetIds = typedTemplate.assignment_specs.map((s) => s.worksheet_id)
  let worksheets: Worksheet[] = []
  if (worksheetIds.length > 0) {
    const { data } = await supabase
      .from('worksheets')
      .select('id, title, description, instructions, schema')
      .in('id', worksheetIds)
      .is('deleted_at', null)

    worksheets = (data || []) as Worksheet[]
  }

  return <TemplatePreview template={typedTemplate} worksheets={worksheets} />
}
