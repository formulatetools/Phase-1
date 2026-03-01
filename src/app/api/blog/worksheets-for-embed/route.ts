import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns a lightweight list of published worksheets for the
 * worksheet embed picker in the blog editor.
 */
export async function GET() {
  try {
    const { user } = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: worksheets } = await supabase
      .from('worksheets')
      .select('id, title, slug, description, categories(name)')
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('title')

    const mapped = (worksheets ?? []).map((w) => {
      const ws = w as unknown as { id: string; title: string; slug: string; description: string; categories: { name: string } | { name: string }[] | null }
      const cat = Array.isArray(ws.categories) ? ws.categories[0]?.name : ws.categories?.name
      return {
        id: ws.id,
        title: ws.title,
        slug: ws.slug,
        description: ws.description || '',
        category: cat || '',
      }
    })

    return NextResponse.json(
      { worksheets: mapped },
      { headers: { 'Cache-Control': 'private, max-age=3600, stale-while-revalidate=1800' } }
    )
  } catch (err) {
    console.error('Worksheets-for-embed error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
