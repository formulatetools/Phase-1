import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Custom Tiptap Node for embedding a worksheet card inside a blog post.
 * Stores worksheet metadata as attributes so it can be rendered both
 * in the editor (interactive preview card) and in the public blog
 * (read-only WorksheetEmbedCard).
 */
export const WorksheetEmbedExtension = Node.create({
  name: 'worksheetEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      worksheetId: { default: null },
      worksheetTitle: { default: '' },
      worksheetSlug: { default: '' },
      worksheetDescription: { default: '' },
      worksheetCategory: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-worksheet-embed]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-worksheet-embed': '',
        'data-worksheet-id': HTMLAttributes.worksheetId,
        'data-worksheet-title': HTMLAttributes.worksheetTitle,
        'data-worksheet-slug': HTMLAttributes.worksheetSlug,
        'data-worksheet-description': HTMLAttributes.worksheetDescription,
        'data-worksheet-category': HTMLAttributes.worksheetCategory,
      }),
      `📋 ${HTMLAttributes.worksheetTitle || 'Worksheet'}`,
    ]
  },
})
