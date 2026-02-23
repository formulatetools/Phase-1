import { Skeleton } from '@/components/ui/skeleton'

export default function WorksheetDetailLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      {/* Breadcrumb */}
      <Skeleton className="mb-6 h-4 w-48" />

      {/* Title + meta */}
      <Skeleton className="mb-2 h-8 w-80" />
      <Skeleton className="mb-6 h-4 w-64" />

      {/* Tags */}
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Worksheet body */}
      <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-3/4" />
        <Skeleton className="mb-6 h-24 w-full rounded-lg" />
        <Skeleton className="mb-3 h-5 w-40" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
