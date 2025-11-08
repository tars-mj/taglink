'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTag,
  getUserTags,
  assignTagsToLink,
  renameTag,
  mergeTags,
  deleteTag,
} from '@/app/actions/tags'
import { queryKeys } from '@/lib/react-query/query-client'
import { useToast } from '@/hooks/use-toast'

/**
 * Hook for fetching all user tags with caching
 */
export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: async () => {
      const result = await getUserTags()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tags')
      }
      return result.data
    },
    // Keep tags fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for creating a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createTag(name)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create tag')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate tags queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.stats })

      toast({
        title: 'Tag Created',
        description: 'New tag has been created successfully',
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
 * Hook for assigning tags to a link
 */
export function useAssignTags() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ linkId, tagIds }: { linkId: string; tagIds: string[] }) => {
      const result = await assignTagsToLink(linkId, tagIds)
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign tags')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate both links and tags queries
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })

      toast({
        title: 'Tags Updated',
        description: 'Tags have been assigned successfully',
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
 * Hook for renaming a tag
 */
export function useRenameTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ tagId, newName }: { tagId: string; newName: string }) => {
      const result = await renameTag(tagId, newName)
      if (!result.success) {
        throw new Error(result.error || 'Failed to rename tag')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate tags and links queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })

      toast({
        title: 'Tag Renamed',
        description: 'Tag name has been updated',
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
 * Hook for merging two tags
 */
export function useMergeTags() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      sourceTagId,
      targetTagId,
    }: {
      sourceTagId: string
      targetTagId: string
    }) => {
      const result = await mergeTags(sourceTagId, targetTagId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to merge tags')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.stats })

      toast({
        title: 'Tags Merged',
        description: 'Tags have been merged successfully',
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
 * Hook for deleting a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (tagId: string) => {
      const result = await deleteTag(tagId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete tag')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.stats })

      toast({
        title: 'Tag Deleted',
        description: 'Tag has been removed',
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
