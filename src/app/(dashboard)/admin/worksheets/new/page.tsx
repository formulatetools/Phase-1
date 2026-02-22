import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { WorksheetEditorForm } from '@/components/ui/worksheet-editor-form'
import { createWorksheet } from '../actions'

export const metadata = { title: 'New Worksheet — Admin — Formulate' }

export default async function NewWorksheetPage() {
  const { profile } = await getCurrentUser()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order')

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <Link href="/admin" className="text-sm text-accent-600 hover:text-accent-700">
          &larr; Back to Admin
        </Link>
      </div>
      <h1 className="mb-8 text-3xl font-bold text-primary-900">New Worksheet</h1>
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        <WorksheetEditorForm
          categories={(categories || []) as { id: string; name: string }[]}
          action={createWorksheet}
        />
      </div>
    </main>
  )
}
