import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function FeatureRequestsLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form skeleton */}
      <div className="mb-8 max-w-xl">
        <SkeletonCard lines={4} />
      </div>

      {/* Request list */}
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="space-y-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  )
}
