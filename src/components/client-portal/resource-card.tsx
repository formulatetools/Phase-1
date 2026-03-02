'use client'

import { useState } from 'react'
import { detectVideoEmbed, extractDomain } from '@/lib/utils/video-embed'

export interface PortalResource {
  id: string
  resource_type: 'link' | 'psychoeducation'
  title: string
  therapist_note: string | null
  shared_at: string
  viewed_at: string | null
  url: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  og_site_name: string | null
  article_id: string | null
  article_summary: string | null
  article_category: string | null
  article_reading_time: number | null
}

interface ResourceCardProps {
  resource: PortalResource
  portalToken: string
  appUrl: string
}

export function ResourceCard({ resource, portalToken, appUrl }: ResourceCardProps) {
  const [showEmbed, setShowEmbed] = useState(false)

  if (resource.resource_type === 'link') {
    return (
      <LinkResourceCard
        resource={resource}
        portalToken={portalToken}
        appUrl={appUrl}
        showEmbed={showEmbed}
        onToggleEmbed={() => setShowEmbed(!showEmbed)}
      />
    )
  }

  // Psychoeducation variant (future)
  return (
    <PsychoedResourceCard
      resource={resource}
      portalToken={portalToken}
    />
  )
}

function LinkResourceCard({
  resource,
  portalToken,
  appUrl,
  showEmbed,
  onToggleEmbed,
}: ResourceCardProps & { showEmbed: boolean; onToggleEmbed: () => void }) {
  const url = resource.url || ''
  const video = detectVideoEmbed(url)
  const domain = extractDomain(url)
  const displayTitle = resource.og_title || resource.title
  const displayDescription = resource.og_description

  const handleClick = () => {
    // Fire resource-viewed event (non-blocking)
    fetch(`${appUrl}/api/client-portal/resource-viewed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portalToken, resourceId: resource.id }),
    }).catch(() => {})
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="relative shrink-0">
          {video ? (
            <button
              onClick={() => {
                handleClick()
                onToggleEmbed()
              }}
              className="group relative block h-20 w-[120px] rounded-xl bg-primary-100 overflow-hidden"
            >
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <VideoIcon />
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
                  <svg className="h-4 w-4 text-primary-800 dark:text-primary-200 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          ) : resource.og_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.og_image_url}
              alt=""
              className="h-20 w-[120px] rounded-xl object-cover bg-primary-100"
            />
          ) : (
            <div className="flex h-20 w-[120px] items-center justify-center rounded-xl bg-primary-50">
              <LinkIcon />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary-900 line-clamp-2">{displayTitle}</h3>
          {displayDescription && (
            <p className="mt-0.5 text-xs text-primary-500 dark:text-primary-600 line-clamp-2">{displayDescription}</p>
          )}
          {resource.therapist_note && (
            <p className="mt-1.5 text-xs text-brand-dark italic">
              &ldquo;{resource.therapist_note}&rdquo;
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {domain && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-500 dark:bg-primary-100 dark:text-primary-600">
                {video ? (
                  <VideoIcon className="h-3 w-3" />
                ) : (
                  <LinkIcon className="h-3 w-3" />
                )}
                {resource.og_site_name || domain}
              </span>
            )}
            <span className="text-[10px] text-primary-300 dark:text-primary-500">
              {new Date(resource.shared_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Open button */}
        {!video && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="shrink-0 self-center rounded-lg border border-primary-200 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:border-primary-300 dark:text-primary-700 dark:hover:bg-primary-100 transition-colors flex items-center gap-1"
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
              title={displayTitle}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PsychoedResourceCard({
  resource,
  portalToken,
}: {
  resource: PortalResource
  portalToken: string
}) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          {resource.article_category && (
            <span className="inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-dark mb-1">
              {resource.article_category}
            </span>
          )}
          <h3 className="text-sm font-semibold text-primary-900">{resource.title}</h3>
          {resource.article_summary && (
            <p className="mt-0.5 text-xs text-primary-500 dark:text-primary-600 line-clamp-2">{resource.article_summary}</p>
          )}
          {resource.therapist_note && (
            <p className="mt-1.5 text-xs text-brand-dark italic">
              &ldquo;{resource.therapist_note}&rdquo;
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {resource.article_reading_time && (
              <span className="text-[10px] text-primary-400 dark:text-primary-600">
                {resource.article_reading_time} min read
              </span>
            )}
            <a
              href={`/client/${portalToken}/article/${resource.article_id}`}
              className="ml-auto rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:border-primary-300 dark:text-primary-700 dark:hover:bg-primary-100 transition-colors"
            >
              Read →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkIcon({ className = 'h-5 w-5 text-primary-400' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
    </svg>
  )
}

function VideoIcon({ className = 'h-5 w-5 text-primary-400' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}
