import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { WorksheetSchema } from '@/types/worksheet'
import type { ContributorRoles } from '@/types/database'
import { CustomWorksheetBuilder } from '@/components/my-tools/custom-worksheet-builder'

export const metadata = { title: 'Edit Tool — Formulate' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditToolPage({ params }: PageProps) {
  const { id } = await params
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  // Fetch the worksheet (must be owned by user, non-curated, not deleted)
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('id, title, description, instructions, schema, category_id, tags, estimated_minutes, forked_from, library_status, admin_feedback')
    .eq('id', id)
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order')

  const typedWorksheet = worksheet as {
    id: string
    title: string
    description: string
    instructions: string
    schema: WorksheetSchema
    category_id: string | null
    tags: string[]
    estimated_minutes: number | null
    forked_from: string | null
    library_status: string | null
    admin_feedback: string | null
  }

  const contributorRoles = profile.contributor_roles as ContributorRoles | null
  const isContributor = !!contributorRoles?.clinical_contributor

  return (
    <CustomWorksheetBuilder
      mode="edit"
      worksheetId={typedWorksheet.id}
      categories={(categories || []) as { id: string; name: string }[]}
      isContributor={isContributor}
      agreementAccepted={!!profile.contributor_agreement_accepted_at}
      libraryStatus={typedWorksheet.library_status}
      adminFeedback={typedWorksheet.admin_feedback}
      initialData={{
        title: typedWorksheet.title,
        description: typedWorksheet.description || '',
        instructions: typedWorksheet.instructions || '',
        category_id: typedWorksheet.category_id,
        tags: typedWorksheet.tags || [],
        estimated_minutes: typedWorksheet.estimated_minutes,
        schema: typedWorksheet.schema,
        forked_from: typedWorksheet.forked_from,
      }}
    />
  )
}
