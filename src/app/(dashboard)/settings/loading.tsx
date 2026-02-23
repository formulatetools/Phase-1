import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-6 max-w-2xl">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  )
}
