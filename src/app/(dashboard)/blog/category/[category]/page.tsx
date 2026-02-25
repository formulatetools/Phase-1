import { redirect } from 'next/navigation'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { Metadata } from 'next'

const validCategories = ['clinical', 'worksheet-guide', 'practice', 'updates']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const label = BLOG_CATEGORY_LABELS[category] || category
  return {
    title: `${label} Articles — Formulate Blog`,
    description: `Browse ${label.toLowerCase()} articles on the Formulate blog.`,
  }
}

/**
 * Category pages simply redirect to the blog index with a category filter.
 * This keeps the UI in one place while giving each category a crawlable URL.
 */
export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!validCategories.includes(category)) {
    redirect('/blog')
  }

  redirect(`/blog?category=${category}`)
}
