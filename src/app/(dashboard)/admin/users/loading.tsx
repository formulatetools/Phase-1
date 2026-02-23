import { Skeleton, SkeletonStatGrid, SkeletonTable } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Stat cards */}
      <SkeletonStatGrid count={5} />

      {/* Table */}
      <div className="mt-8">
        <SkeletonTable rows={8} cols={5} />
      </div>
    </div>
  )
}
