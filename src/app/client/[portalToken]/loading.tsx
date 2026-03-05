import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function ClientPortalLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-t-[3px] border-t-brand border-b border-b-primary-100 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <Skeleton className="mb-2 h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Content cards */}
        <div className="space-y-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </main>
    </div>
  )
}
