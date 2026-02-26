import { Skeleton, SkeletonList } from '@/components/ui/skeleton'

export default function SupervisionLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonList items={3} />
    </div>
  )
}
