import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function ReferralsLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <SkeletonCard lines={3} />
      <div className="mt-6">
        <Skeleton className="mb-4 h-5 w-32" />
        <SkeletonCard lines={4} />
      </div>
    </div>
  )
}
