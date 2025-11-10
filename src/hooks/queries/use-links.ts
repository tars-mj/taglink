'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchLinks, type SearchParams, type SearchResult } from '@/app/actions/search'
import { createLink, updateLink, deleteLink } from '@/app/actions/links'
import { queryKeys } from '@/lib/react-query/query-client'
import { useToast } from '@/hooks/use-toast'

/**
 * Hook for fetching and searching links with caching
 * Automatically caches results based on search parameters
 */
export function useLinks(params: SearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.links.list(params),
    queryFn: async () => {
      const result = await searchLinks(params)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch links')
      }
      return result.data as SearchResult
    },
    // Keep data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for creating a new link with automatic cache invalidation
 */
export function useCreateLink() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createLink(formData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create link')
      }
      return result
    },
    onSuccess: (result) => {
      // Invalidate all link queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.statistics })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.stats })

      const linkTitle = result.data?.title || 'Link'
      toast({
        title: 'Link added!',
        description: `"${linkTitle}" has been saved with AI-generated description and tags.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for updating an existing link
 */
export function useUpdateLink() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await updateLink(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update link')
      }
      return result
    },
    onSuccess: async () => {
      // Invalidate queries to refetch updated data - await to ensure data is refreshed
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.links.statistics })
      ])

      toast({
        title: 'Link Updated',
        description: 'Your changes have been saved',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for deleting a link (soft delete)
 */
export function useDeleteLink() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (linkId: string) => {
      const result = await deleteLink(linkId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete link')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate queries to refetch data without deleted link
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.statistics })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.stats })

      toast({
        title: 'Link Deleted',
        description: 'The link has been removed',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
