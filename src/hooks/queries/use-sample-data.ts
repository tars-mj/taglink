'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loadSampleData, checkUserHasLinks } from '@/app/actions/sample-data'
import { queryKeys } from '@/lib/react-query/query-client'
import { useToast } from '@/hooks/use-toast'

/**
 * Hook for checking if user has any links (to determine if sample data should be shown)
 */
export function useCheckUserHasLinks() {
  return useQuery({
    queryKey: queryKeys.user.stats,
    queryFn: async () => {
      const result = await checkUserHasLinks()
      if (!result.success) {
        throw new Error(result.error || 'Failed to check user links')
      }
      return {
        hasLinks: result.hasLinks,
        count: result.count,
      }
    },
    staleTime: 5 * 60 * 1000, // Keep fresh for 5 minutes
  })
}

/**
 * Hook for loading sample data with automatic cache invalidation
 */
export function useLoadSampleData() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const result = await loadSampleData()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load sample data')
      }
      return result
    },
    onSuccess: (result) => {
      // Invalidate all relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.statistics })
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.stats })

      const linksCreated = result.data?.linksCreated ?? 0
      const tagsCreated = result.data?.tagsCreated ?? 0

      toast({
        title: 'Sample data loaded!',
        description: `Created ${linksCreated} links with ${tagsCreated} tags. Explore your new collection!`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error loading sample data',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
