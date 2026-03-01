import { cache } from 'react'
import { createClient } from './server'

/**
 * Cached query helpers for server components.
 *
 * React.cache() deduplicates calls within a single request lifecycle,
 * so generateMetadata + page render share one DB round-trip.
 */

export const getBlogPostBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()
  return data
})

export const getWorksheetBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('worksheets')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single()
  return data
})

export const getCategoryBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
})
