'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteCustomWorksheet } from '@/app/(dashboard)/my-tools/actions'

interface CustomWorksheetItem {
  id: string
  title: string
  description: string
  tags: string[]
  created_at: string
  updated_at: string
  forked_from: string | null
  estimated_minutes: number | null
}

interface MyToolsListProps {
  worksheets: CustomWorksheetItem[]
}

export function MyToolsList({ worksheets }: MyToolsListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const result = await deleteCustomWorksheet(id)
    if (result.error) {
      alert(result.error)
    }
    setDeleting(null)
    setConfirmId(null)
  }

  if (worksheets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <svg className="h-6 w-6 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-primary-500">No custom tools yet</p>
        <p className="mt-1 text-xs text-primary-400">Create your first custom worksheet or customise one from the library</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/my-tools/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create new
          </Link>
          <Link
            href="/worksheets"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            Browse library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {worksheets.map((ws) => (
          <div
            key={ws.id}
            className="group relative rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div className="flex gap-1">
                <Link
                  href={`/my-tools/${ws.id}/edit`}
                  className="rounded-lg p-1.5 text-primary-300 transition-colors hover:bg-primary-50 hover:text-primary-600"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </Link>
                <button
                  onClick={() => setConfirmId(ws.id)}
                  className="rounded-lg p-1.5 text-primary-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <Link href={`/my-tools/${ws.id}`} className="block">
              <h3 className="mt-3 text-sm font-semibold text-primary-800 group-hover:text-primary-900">
                {ws.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-primary-400">
                {ws.description}
              </p>
            </Link>

            {/* Tags + metadata */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {ws.forked_from && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  Customised
                </span>
              )}
              {ws.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-500">
                  {tag}
                </span>
              ))}
              {ws.tags.length > 2 && (
                <span className="text-[10px] text-primary-300">+{ws.tags.length - 2}</span>
              )}
            </div>

            <p className="mt-2 text-[10px] text-primary-300">
              Updated {new Date(ws.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-primary-100 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-primary-900">Delete worksheet?</h3>
            <p className="mt-2 text-sm text-primary-500">
              This will remove the worksheet from your tools. Any existing homework assignments using this worksheet will still be accessible.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting === confirmId}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === confirmId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
