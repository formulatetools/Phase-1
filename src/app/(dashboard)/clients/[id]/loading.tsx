import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function ClientDetailLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-24" />

      {/* Client header */}
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Assignments */}
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="space-y-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  )
}
