/**
 * Blog utility functions.
 */

/**
 * Calculate reading time from Tiptap JSON content.
 * Extracts all text nodes, counts words, divides by 200 WPM.
 * Returns a minimum of 1 minute.
 */
export function calculateReadingTime(
  content: Record<string, unknown>
): number {
  let text = ''

  function extractText(node: Record<string, unknown>) {
    if (node.type === 'text' && typeof node.text === 'string') {
      text += node.text + ' '
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        extractText(child as Record<string, unknown>)
      }
    }
  }

  extractText(content)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

/**
 * Category display labels.
 */
export const BLOG_CATEGORY_LABELS: Record<string, string> = {
  clinical: 'Clinical',
  'worksheet-guide': 'Worksheet Guide',
  practice: 'Practice Tips',
  updates: 'Updates',
}

/**
 * Generate a URL-safe slug from a title.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
