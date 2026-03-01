/**
 * Skeleton primitives for loading states.
 * Uses bg-primary-100 which adapts to dark mode via CSS variable overrides.
 */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-primary-100 ${className}`} />
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-4 sm:p-5 shadow-sm">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-6 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`mb-2 h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-3 sm:p-5 shadow-sm">
      <Skeleton className="mb-2 sm:mb-3 h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
      <Skeleton className="mb-2 h-7 sm:h-8 w-16 sm:w-20" />
      <Skeleton className="h-4 w-24 sm:w-28" />
    </div>
  )
}

function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm">
      <div className="border-b border-primary-100 px-6 py-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="mb-3 flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-surface p-4 shadow-sm">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStatCard, SkeletonStatGrid, SkeletonTable, SkeletonList }
