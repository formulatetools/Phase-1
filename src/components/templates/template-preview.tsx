'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WorkspaceTemplate } from '@/types/database'
import type { WorksheetSchema } from '@/types/worksheet'
import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import { detectVideoEmbed, extractDomain } from '@/lib/utils/video-embed'

// ─── Types ───────────────────────────────────────────────────────

interface PreviewWorksheet {
  id: string
  title: string
  description: string
  instructions: string
  schema: WorksheetSchema
}

interface TemplatePreviewProps {
  template: WorkspaceTemplate
  worksheets: PreviewWorksheet[]
}

// ─── Component ───────────────────────────────────────────────────

export function TemplatePreview({ template, worksheets }: TemplatePreviewProps) {
  const [activeTab, setActiveTab] = useState<'homework' | 'resources'>('homework')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))

  const hasWorksheets = template.assignment_specs.length > 0
  const hasResources = template.resource_specs.length > 0
  const hasBoth = hasWorksheets && hasResources

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-2">
          <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            You&apos;re previewing this homework plan as your client would see it
          </p>
        </div>
      </div>

      {/* Portal-style layout */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary-900">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-sm text-primary-500">{template.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-primary-400">
            <span>{template.assignment_specs.length} worksheet{template.assignment_specs.length !== 1 ? 's' : ''}</span>
            <span>{template.resource_specs.length} resource{template.resource_specs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Tabs — only show when plan has both worksheets and resources */}
        {hasBoth && (
          <div className="mb-6 border-b border-primary-100">
            <nav className="-mb-px flex" aria-label="Preview tabs">
              {[
                { id: 'homework' as const, label: 'Homework', count: template.assignment_specs.length },
                { id: 'resources' as const, label: 'Resources', count: template.resource_specs.length },
              ].map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 sm:flex-initial px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-900'
                        : 'text-primary-400 hover:text-primary-600'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {tab.label}
                      <span
                        className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? 'bg-brand/15 text-brand-dark'
                            : 'bg-primary-100 text-primary-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </span>
                    {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        {/* Homework tab */}
        {(activeTab === 'homework' || !hasBoth) && hasWorksheets && (
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-primary-800">Current Homework</h2>
              <div className="mt-1 h-0.5 w-8 bg-brand" />
              <div className="mt-4 space-y-3">
                {template.assignment_specs.map((spec, idx) => {
                  const ws = worksheetMap.get(spec.worksheet_id)
                  const isExpanded = expandedId === spec.worksheet_id

                  if (!ws) {
                    return (
                      <div
                        key={`missing-${idx}`}
                        className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center"
                      >
                        <p className="text-sm text-amber-600">This worksheet is no longer available</p>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={spec.worksheet_id}
                      className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden"
                    >
                      {/* Card header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : spec.worksheet_id)}
                        className="flex w-full items-center gap-3 p-4 text-left hover:bg-primary-50/50 transition-colors"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                          <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-primary-900">{ws.title}</h3>
                          {ws.description && (
                            <p className="mt-0.5 text-xs text-primary-500 line-clamp-1">{ws.description}</p>
                          )}
                        </div>
                        <svg
                          className={`h-5 w-5 shrink-0 text-primary-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {/* Expanded worksheet content */}
                      {isExpanded && (
                        <div className="border-t border-primary-100 px-4 py-5">
                          {ws.instructions && (
                            <div className="mb-4 rounded-xl bg-primary-50 p-3 text-sm text-primary-600">
                              {ws.instructions}
                            </div>
                          )}
                          <WorksheetRenderer schema={ws.schema} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}

        {/* Resources tab */}
        {((hasBoth && activeTab === 'resources') || (!hasBoth && !hasWorksheets && hasResources)) && (
          <div className="space-y-3">
            {template.resource_specs.map((spec, idx) => {
              const video = detectVideoEmbed(spec.url)
              const domain = extractDomain(spec.url)

              return (
                <PreviewResourceCard
                  key={idx}
                  title={spec.title}
                  url={spec.url}
                  note={spec.note}
                  video={video}
                  domain={domain}
                />
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!hasWorksheets && !hasResources && (
          <div className="rounded-2xl border-2 border-dashed border-primary-200 py-12 text-center">
            <p className="text-sm text-primary-500">This homework plan has no worksheets or resources to preview.</p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/homework-plans"
            className="text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
          >
            ← Back to homework plans
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Resource preview card ──────────────────────────────────────

function PreviewResourceCard({
  title,
  url,
  note,
  video,
  domain,
}: {
  title: string
  url: string
  note?: string
  video: ReturnType<typeof detectVideoEmbed>
  domain: string
}) {
  const [showEmbed, setShowEmbed] = useState(false)

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="relative shrink-0">
          {video ? (
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className="group relative block h-20 w-[120px] rounded-xl bg-primary-100 overflow-hidden"
            >
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
                  <svg className="h-4 w-4 text-primary-800 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          ) : (
            <div className="flex h-20 w-[120px] items-center justify-center rounded-xl bg-primary-50">
              <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary-900 line-clamp-2">{title}</h3>
          {note && (
            <p className="mt-1.5 text-xs text-brand-dark italic">
              &ldquo;{note}&rdquo;
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {domain && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-500">
                {video ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                  </svg>
                )}
                {domain}
              </span>
            )}
          </div>
        </div>

        {/* Open button for non-video */}
        {!video && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 self-center rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-1"
          >
            Open
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>

      {/* Embedded video player */}
      {video && showEmbed && (
        <div className="border-t border-primary-100 bg-black">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={video.embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        </div>
      )}
    </div>
  )
}
