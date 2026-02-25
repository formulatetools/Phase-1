'use client'

import { useCallback, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { WorksheetEmbedExtension } from './worksheet-embed-extension'
import { EditorToolbar } from './editor-toolbar'
import { WorksheetPickerModal } from './worksheet-picker-modal'

interface BlogEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function BlogEditor({ content, onChange }: BlogEditorProps) {
  const [showWorksheetPicker, setShowWorksheetPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl max-w-full my-4' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-brand hover:text-brand-dark underline' },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your article...',
      }),
      Underline,
      WorksheetEmbedExtension,
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-6 py-4 min-h-[400px] focus:outline-none text-primary-800',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>)
    },
  })

  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      // Validate
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB')
        return
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('Only PNG, JPEG, and WebP images are supported')
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/blog/upload-image', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) {
          alert(data.error || 'Upload failed')
          return
        }

        editor.chain().focus().setImage({ src: data.url }).run()
      } catch {
        alert('Upload failed')
      } finally {
        setUploading(false)
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [editor]
  )

  const handleWorksheetSelected = useCallback(
    (worksheet: { id: string; title: string; slug: string; description: string; category: string }) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'worksheetEmbed',
          attrs: {
            worksheetId: worksheet.id,
            worksheetTitle: worksheet.title,
            worksheetSlug: worksheet.slug,
            worksheetDescription: worksheet.description,
            worksheetCategory: worksheet.category,
          },
        })
        .run()
      setShowWorksheetPicker(false)
    },
    [editor]
  )

  return (
    <div className="rounded-xl border border-primary-200 bg-surface overflow-hidden">
      <EditorToolbar
        editor={editor}
        onInsertImage={handleImageUpload}
        onInsertWorksheet={() => setShowWorksheetPicker(true)}
      />

      {uploading && (
        <div className="bg-brand-light px-4 py-1.5 text-xs text-brand-text">
          Uploading image…
        </div>
      )}

      <EditorContent editor={editor} />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      {showWorksheetPicker && (
        <WorksheetPickerModal
          onSelect={handleWorksheetSelected}
          onClose={() => setShowWorksheetPicker(false)}
        />
      )}
    </div>
  )
}
