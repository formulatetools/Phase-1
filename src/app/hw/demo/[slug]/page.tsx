import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createDirectClient } from '@supabase/supabase-js'
import type { Worksheet } from '@/types/database'
import { DemoHomework } from './demo-homework'
import { DEMO_DATA, DEMO_WORKSHEETS } from '@/lib/demo-data'

export const metadata: Metadata = {
  title: 'Try the Client Experience — Formulate',
  description:
    'See exactly what your clients see when they receive a homework assignment. Interactive demo — no account required.',
  robots: 'noindex, nofollow',
}

const validSlugs = new Set<string>(DEMO_WORKSHEETS.map((w) => w.slug))

export function generateStaticParams() {
  return DEMO_WORKSHEETS.map((w) => ({ slug: w.slug }))
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!validSlugs.has(slug)) notFound()

  // Load the real worksheet schema from Supabase
  const supabase = createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('title, description, instructions, schema')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single()

  if (!worksheet) notFound()

  const typedWorksheet = worksheet as Pick<Worksheet, 'title' | 'description' | 'instructions' | 'schema'>
  const demoData = DEMO_DATA[slug] || undefined

  return (
    <DemoHomework
      slug={slug}
      title={typedWorksheet.title}
      description={typedWorksheet.description}
      instructions={typedWorksheet.instructions}
      schema={typedWorksheet.schema}
      demoData={demoData}
    />
  )
}
