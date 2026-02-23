import { Skeleton, SkeletonStatGrid } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Stat cards */}
      <SkeletonStatGrid count={8} />

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
        <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
