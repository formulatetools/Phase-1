import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { WorksheetEditorForm } from '@/components/ui/worksheet-editor-form'
import { updateWorksheet } from '../../actions'

export const metadata = { title: 'Edit Worksheet — Admin — Formulate' }

export default async function EditWorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { profile } = await getCurrentUser()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order')

  const boundUpdate = updateWorksheet.bind(null, worksheet.id as string)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <Link href="/admin" className="text-sm text-brand-text hover:text-brand-dark">
          &larr; Back to Admin
        </Link>
      </div>
      <h1 className="mb-8 text-3xl font-bold text-primary-900">
        Edit: {worksheet.title as string}
      </h1>
      <div className="rounded-xl border border-primary-100 bg-surface p-6 shadow-sm">
        <WorksheetEditorForm
          categories={(categories || []) as { id: string; name: string }[]}
          action={boundUpdate}
          defaultValues={{
            title: worksheet.title as string,
            slug: worksheet.slug as string,
            description: worksheet.description as string,
            instructions: worksheet.instructions as string,
            category_id: worksheet.category_id as string,
            is_premium: worksheet.is_premium as boolean,
            is_published: worksheet.is_published as boolean,
            tags: worksheet.tags as string[],
            estimated_minutes: worksheet.estimated_minutes as number | null,
            schema: JSON.stringify(worksheet.schema, null, 2),
          }}
        />
      </div>
    </main>
  )
}
