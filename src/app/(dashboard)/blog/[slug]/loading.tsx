import { Skeleton } from '@/components/ui/skeleton'

export default function BlogPostLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-4 w-16" />
      <Skeleton className="mb-3 h-6 w-24 rounded-full" />
      <Skeleton className="mb-2 h-9 w-full" />
      <Skeleton className="mb-4 h-9 w-3/4" />

      {/* Author */}
      <div className="mt-3 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="mb-1 h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      {/* Cover image */}
      <Skeleton className="mt-6 h-64 w-full rounded-xl" />

      {/* Content lines */}
      <div className="mt-8 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
    </article>
  )
}
