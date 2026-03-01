'use client'

import { useCallback, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BlogEditor } from '@/components/blog/editor/blog-editor'
import { saveBlogDraft, updateBlogDraft, submitBlogPost } from '../actions'
import { BLOG_CATEGORY_LABELS } from '@/lib/utils/blog'
import type { BlogCategory } from '@/types/database'

interface BlogPostFormProps {
  postId?: string
  initialTitle?: string
  initialExcerpt?: string
  initialCategory?: BlogCategory
  initialTags?: string[]
  initialContent?: Record<string, unknown>
  initialCoverImageUrl?: string | null
  initialRelatedWorksheetIds?: string[]
  initialStatus?: string
  initialFeedback?: string | null
}

export function BlogPostForm({
  postId,
  initialTitle = '',
  initialExcerpt = '',
  initialCategory = 'clinical',
  initialTags = [],
  initialContent = {},
  initialCoverImageUrl = null,
  initialRelatedWorksheetIds = [],
  initialStatus = 'draft',
  initialFeedback = null,
}: BlogPostFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialTitle)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [category, setCategory] = useState<BlogCategory>(initialCategory)
  const [tagsInput, setTagsInput] = useState(initialTags.join(', '))
  const [content, setContent] = useState<Record<string, unknown>>(initialContent)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialCoverImageUrl)
  const [relatedWorksheetIds] = useState<string[]>(initialRelatedWorksheetIds)

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(postId ?? null)
  const [isDirty, setIsDirty] = useState(false)

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const markDirty = useCallback(() => setIsDirty(true), [])

  const parseTags = (): string[] =>
    tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

  // Cover image upload
  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Cover image must be under 5MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/blog/upload-image', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setCoverImageUrl(data.url)
        markDirty()
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    }
  }, [markDirty])

  // Save draft
  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)

    const formData = {
      title,
      excerpt,
      category,
      tags: parseTags(),
      content,
      coverImageUrl,
      relatedWorksheetIds,
    }

    const result = savedId
      ? await updateBlogDraft(savedId, formData)
      : await saveBlogDraft(formData)

    if (result.success) {
      setIsDirty(false)
      if (result.postId && !savedId) {
        setSavedId(result.postId)
        router.replace(`/blog/write/${result.postId}`)
      }
    } else {
      setError(result.error || 'Failed to save')
    }

    setSaving(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, excerpt, category, tagsInput, content, coverImageUrl, relatedWorksheetIds, savedId, router])

  // Submit for review
  const handleSubmit = useCallback(async () => {
    if (!savedId) {
      setError('Save the draft first before submitting')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await submitBlogPost(savedId)
    if (result.success) {
      setIsDirty(false)
      router.push('/blog/write')
    } else {
      setError(result.error || 'Submit failed')
    }

    setSubmitting(false)
  }, [savedId, router])

  const canSubmit = initialStatus === 'draft' || initialStatus === 'changes_requested'

  return (
    <div className="space-y-6">
      {/* Admin feedback banner */}
      {initialFeedback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium text-amber-700 mb-1">Reviewer feedback</p>
          <p className="text-sm text-amber-800">{initialFeedback}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Cover image */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-primary-700">Cover Image</label>
        {coverImageUrl ? (
          <div className="relative aspect-[3/1] overflow-hidden rounded-xl">
            <Image src={coverImageUrl} alt="Cover preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
            <button
              type="button"
              onClick={() => { setCoverImageUrl(null); markDirty() }}
              className="absolute top-2 right-2 rounded-lg bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary-200 py-8 text-sm text-primary-400 hover:border-brand hover:text-brand-text transition-colors">
            Click to upload cover image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </label>
        )}
      </div>

      {/* Title + metadata */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="blog-title" className="mb-1 block text-sm font-medium text-primary-700">
            Title
          </label>
          <input
            id="blog-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty() }}
            placeholder="Your article title"
            className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-400"
          />
        </div>

        <div>
          <label htmlFor="blog-excerpt" className="mb-1 block text-sm font-medium text-primary-700">
            Excerpt
          </label>
          <textarea
            id="blog-excerpt"
            value={excerpt}
            onChange={(e) => { setExcerpt(e.target.value); markDirty() }}
            rows={2}
            placeholder="A short summary for the blog listing and SEO (1-2 sentences)"
            className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-400 resize-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="blog-category" className="mb-1 block text-sm font-medium text-primary-700">
              Category
            </label>
            <select
              id="blog-category"
              value={category}
              onChange={(e) => { setCategory(e.target.value as BlogCategory); markDirty() }}
              className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800"
            >
              {Object.entries(BLOG_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="blog-tags" className="mb-1 block text-sm font-medium text-primary-700">
              Tags
            </label>
            <input
              id="blog-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => { setTagsInput(e.target.value); markDirty() }}
              placeholder="cbt, anxiety, formulation"
              className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-400"
            />
            <p className="mt-0.5 text-[10px] text-primary-400">Comma-separated</p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div>
        <label className="mb-2 block text-sm font-medium text-primary-700">Content</label>
        <BlogEditor
          content={content}
          onChange={(c) => { setContent(c); markDirty() }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || submitting}
          className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : savedId ? 'Save Changes' : 'Save Draft'}
        </button>

        {canSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || submitting || !savedId}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        )}

        {isDirty && (
          <span className="text-xs text-amber-600">Unsaved changes</span>
        )}
      </div>
    </div>
  )
}
