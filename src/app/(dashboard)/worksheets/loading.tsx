import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function WorksheetsLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Search bar */}
      <Skeleton className="mb-8 h-11 w-full rounded-xl" />

      {/* Category cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    </div>
  )
}
