import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { DefaultView } from '@/types'

interface LinkCardSkeletonProps {
  viewMode?: DefaultView
}

export function LinkCardSkeleton({ viewMode = 'grid' }: LinkCardSkeletonProps) {
  // List view - compact horizontal layout
  if (viewMode === 'list') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Title and domain */}
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-2/3 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>

            {/* Tags - compact */}
            <div className="flex-shrink-0 max-w-xs">
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>

            {/* Rating */}
            <div className="flex-shrink-0">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded" />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view - original card layout
  return (
    <Card className="w-full h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="mb-2 h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Tags area - fixed height */}
          <div className="min-h-[56px] flex items-center">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>

        {/* Footer with rating and status */}
        <div className="flex items-center justify-between pt-3 border-t mt-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-5 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Multiple link card skeletons in a grid or list
 */
interface LinkCardSkeletonGridProps {
  count?: number
  viewMode?: DefaultView
}

export function LinkCardSkeletonGrid({ count = 6, viewMode = 'grid' }: LinkCardSkeletonGridProps) {
  return (
    <div className={
      viewMode === 'grid'
        ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        : 'flex flex-col gap-3'
    }>
      {[...Array(count)].map((_, i) => (
        <LinkCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}
