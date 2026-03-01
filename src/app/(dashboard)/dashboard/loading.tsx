import { Skeleton, SkeletonStatGrid, SkeletonCard } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Greeting */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stat cards */}
      <div className="mb-8">
        <SkeletonStatGrid count={4} />
      </div>

      {/* Plan + Quick Actions + Activity */}
      <div className="mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <div className="col-span-2 lg:col-span-1">
          <SkeletonCard lines={3} />
        </div>
      </div>

      {/* Recently used */}
      <div>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </div>
  )
}
