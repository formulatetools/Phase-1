import { Skeleton } from '@/components/ui/skeleton'

export default function HomeworkLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-t-[3px] border-t-brand border-b border-b-primary-100 bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <Skeleton className="mb-3 h-7 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {/* Form fields */}
        <div className="space-y-6">
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-36" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-28" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>

        {/* Submit button */}
        <Skeleton className="mt-8 h-11 w-full rounded-xl" />
      </main>
    </div>
  )
}
