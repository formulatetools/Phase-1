import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function ReviewLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Back link */}
      <Skeleton className="mb-2 h-4 w-24" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="mt-1 h-4 w-40" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Worksheet info */}
        <div className="lg:col-span-1 space-y-6">
          <SkeletonCard lines={4} />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Right column: Preview + form */}
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={6} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    </div>
  )
}
