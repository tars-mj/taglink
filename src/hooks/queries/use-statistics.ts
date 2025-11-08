'use client'

import { useQuery } from '@tanstack/react-query'
import { getLinkStatistics } from '@/app/actions/statistics'
import { queryKeys } from '@/lib/react-query/query-client'

/**
 * Hook for fetching link statistics with caching
 * Statistics include: total links, links by rating, recent activity
 */
export function useLinkStatistics() {
  return useQuery({
    queryKey: queryKeys.links.statistics,
    queryFn: async () => {
      const result = await getLinkStatistics()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics')
      }
      return result.data
    },
    // Keep statistics fresh for 2 minutes (they change less frequently)
    staleTime: 2 * 60 * 1000,
  })
}
