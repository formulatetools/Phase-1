import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/stripe/config'
import type { SubscriptionTier, ContributorRoles } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'

const CustomWorksheetBuilder = dynamic(
  () => import('@/components/my-tools/custom-worksheet-builder').then((m) => m.CustomWorksheetBuilder),
  { ssr: false }
)

export const metadata = { title: 'Create Tool — Formulate' }

interface PageProps {
  searchParams: Promise<{ fork?: string }>
}

export default async function NewToolPage({ searchParams }: PageProps) {
  const { fork: forkId } = await searchParams
  const { user, profile } = await getCurrentUser()
  if (!user || !profile) redirect('/login')

  const tier = profile.subscription_tier as SubscriptionTier
  const limit = TIER_LIMITS[tier].maxCustomWorksheets

  // Free tier cannot create custom worksheets
  if (limit === 0) redirect('/my-tools')

  const supabase = await createClient()

  // Check if at limit
  const { count } = await supabase
    .from('worksheets')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('is_curated', false)
    .is('deleted_at', null)

  if (count !== null && count >= limit) redirect('/my-tools')

  // Fetch categories for the picker
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order')

  // Fetch therapist's active clients for the import-to-client dropdown
  const { data: clients } = await supabase
    .from('therapeutic_relationships')
    .select('id, client_label')
    .eq('therapist_id', user.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('client_label')

  // If forking a curated worksheet, pre-populate with its data
  let initialData: {
    title: string
    description: string
    instructions: string
    category_id: string | null
    tags: string[]
    estimated_minutes: number | null
    schema: WorksheetSchema
    forked_from: string | null
  } | undefined

  if (forkId) {
    const { data: source } = await supabase
      .from('worksheets')
      .select('id, title, description, instructions, category_id, tags, estimated_minutes, schema')
      .eq('id', forkId)
      .is('deleted_at', null)
      .single()

    if (source) {
      const typedSource = source as {
        id: string
        title: string
        description: string
        instructions: string
        category_id: string | null
        tags: string[]
        estimated_minutes: number | null
        schema: WorksheetSchema
      }

      initialData = {
        title: `${typedSource.title} (Custom)`,
        description: typedSource.description || '',
        instructions: typedSource.instructions || '',
        category_id: typedSource.category_id,
        tags: typedSource.tags || [],
        estimated_minutes: typedSource.estimated_minutes,
        schema: typedSource.schema,
        forked_from: typedSource.id,
      }
    }
  }

  const contributorRoles = profile.contributor_roles as ContributorRoles | null
  const isContributor = !!contributorRoles?.clinical_contributor

  return (
    <CustomWorksheetBuilder
      mode="create"
      categories={(categories || []) as { id: string; name: string }[]}
      clients={(clients || []) as { id: string; client_label: string }[]}
      showImportPanel={!forkId}
      tier={tier}
      isContributor={isContributor}
      agreementAccepted={!!profile.contributor_agreement_accepted_at}
      initialData={initialData}
    />
  )
}
