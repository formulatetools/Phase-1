'use client'

import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
  onInsertImage: () => void
  onInsertWorksheet: () => void
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-primary-800 text-white'
          : 'text-primary-600 hover:bg-primary-100 hover:text-primary-900'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor, onInsertImage, onInsertWorksheet }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-primary-100 bg-primary-50/50 px-2 py-1.5 rounded-t-xl">
      {/* Text formatting */}
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-primary-200" />

      {/* Headings */}
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-primary-200" />

      {/* Lists */}
      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        • List
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        1. List
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-primary-200" />

      {/* Block elements */}
      <ToolbarButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        " Quote
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code block"
      >
        {'</>'}
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        ―
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-primary-200" />

      {/* Link */}
      <ToolbarButton
        active={editor.isActive('link')}
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
          } else {
            const url = window.prompt('Link URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }
        }}
        title="Link"
      >
        🔗
      </ToolbarButton>

      {/* Image */}
      <ToolbarButton onClick={onInsertImage} title="Insert image">
        🖼️
      </ToolbarButton>

      {/* Worksheet embed */}
      <ToolbarButton onClick={onInsertWorksheet} title="Embed worksheet">
        📋
      </ToolbarButton>
    </div>
  )
}
