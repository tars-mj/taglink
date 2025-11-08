'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import {
  Link as LinkIcon,
  Star,
  Tag,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { getLinkStatistics, type LinkStatistics } from '@/app/actions/statistics'
import { StatisticsPanelSkeleton } from '@/components/skeletons/statistics-skeleton'

interface LinkStatisticsPanelProps {
  onLoadingChange?: (loading: boolean) => void
}

export function LinkStatisticsPanel({ onLoadingChange }: LinkStatisticsPanelProps) {
  const [statistics, setStatistics] = useState<LinkStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true)
      onLoadingChange?.(true)
      const result = await getLinkStatistics()
      if (result.success && result.data) {
        setStatistics(result.data)
      }
      setIsLoading(false)
      onLoadingChange?.(false)
    }

    fetchStatistics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading || !statistics) {
    return <StatisticsPanelSkeleton />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalLinks}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.recentLinksCount} added in last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Average Rating */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {statistics.averageRating ? statistics.averageRating.toFixed(1) : 'N/A'}
            </div>
            {statistics.averageRating && (
              <StarRating
                value={Math.round(statistics.averageRating)}
                readonly
                size="sm"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on rated links
          </p>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Completed
              </span>
              <span className="text-sm font-medium">{statistics.completedLinks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                Failed
              </span>
              <span className="text-sm font-medium">{statistics.failedLinks}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Used Tags */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Tags</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {statistics.mostUsedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {statistics.mostUsedTags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name} ({tag.count})
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tags yet</p>
          )}
          {statistics.mostUsedTags.length > 3 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{statistics.mostUsedTags.length - 3} more
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      {statistics.linksByRating.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {[5, 4, 3, 2, 1, null].map((rating) => {
                const ratingData = statistics.linksByRating.find((r) => r.rating === rating)
                const count = ratingData?.count || 0
                const percentage =
                  statistics.totalLinks > 0
                    ? ((count / statistics.totalLinks) * 100).toFixed(0)
                    : '0'

                return (
                  <div key={rating ?? 'unrated'} className="space-y-2">
                    <div className="flex items-center justify-between min-h-[20px]">
                      <span className="text-xs font-medium">
                        {rating === null ? (
                          'Unrated'
                        ) : (
                          <StarRating value={rating} readonly size="sm" />
                        )}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-main transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{count}</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
