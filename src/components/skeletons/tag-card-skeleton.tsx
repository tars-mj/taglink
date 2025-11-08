import { Skeleton } from '@/components/ui/skeleton'

export function TagCardSkeleton() {
  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="mb-2 h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      <div className="mt-3">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Multiple tag card skeletons in a grid
 */
export function TagCardSkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <TagCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Tag statistics skeleton for tags page
 */
export function TagStatsSkeleton() {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
