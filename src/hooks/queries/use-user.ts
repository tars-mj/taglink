'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserStats } from '@/app/actions/profile'
import { getUserPreferences, updateUserPreferences, resetUserPreferences } from '@/app/actions/preferences'
import { queryKeys } from '@/lib/react-query/query-client'
import { useToast } from '@/hooks/use-toast'
import type { UpdatePreferencesInput } from '@/types'

/**
 * Hook for fetching user statistics (profile page)
 */
export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.user.stats,
    queryFn: async () => {
      const result = await getUserStats()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user stats')
      }
      return result.data
    },
    // Keep user stats fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching user preferences (settings page)
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.user.preferences,
    queryFn: async () => {
      const result = await getUserPreferences()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch preferences')
      }
      return result.data
    },
    // Keep preferences fresh for 10 minutes (they rarely change)
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for updating user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (preferences: UpdatePreferencesInput) => {
      const formData = new FormData()
      if (preferences.default_view) formData.append('default_view', preferences.default_view)
      if (preferences.links_per_page) formData.append('links_per_page', preferences.links_per_page.toString())
      if (preferences.default_sort) formData.append('default_sort', preferences.default_sort)
      if (preferences.ai_processing_enabled !== undefined)
        formData.append('ai_processing_enabled', preferences.ai_processing_enabled.toString())

      const result = await updateUserPreferences(formData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update preferences')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate preferences query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences })

      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been saved',
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
 * Hook for resetting user preferences to defaults
 */
export function useResetPreferences() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const result = await resetUserPreferences()
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset preferences')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate preferences query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences })

      toast({
        title: 'Preferences Reset',
        description: 'Your preferences have been reset to defaults',
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
