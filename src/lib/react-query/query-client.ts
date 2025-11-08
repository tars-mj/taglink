import { QueryClient } from '@tanstack/react-query'

/**
 * Creates and configures the React Query client with optimal settings
 * for the TagLink application.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes - data is considered fresh for this duration
        staleTime: 5 * 60 * 1000,

        // Cache time: 10 minutes - unused data stays in cache
        gcTime: 10 * 60 * 1000,

        // Refetch on window focus for fresh data when user returns
        refetchOnWindowFocus: true,

        // Retry failed requests once
        retry: 1,

        // Don't refetch on mount if data is still fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  })
}

/**
 * Query keys factory for consistent cache key management
 * Follows the pattern: [entity, ...filters/params]
 */
export const queryKeys = {
  // Links
  links: {
    all: ['links'] as const,
    lists: () => [...queryKeys.links.all, 'list'] as const,
    list: (filters?: {
      search?: string
      tagId?: string
      sortBy?: string
      view?: string
    }) => [...queryKeys.links.lists(), filters] as const,
    details: () => [...queryKeys.links.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.links.details(), id] as const,
    statistics: ['links', 'statistics'] as const,
  },

  // Tags
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (filters?: { search?: string }) => [...queryKeys.tags.lists(), filters] as const,
    details: () => [...queryKeys.tags.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tags.details(), id] as const,
    statistics: ['tags', 'statistics'] as const,
  },

  // User
  user: {
    profile: ['user', 'profile'] as const,
    stats: ['user', 'stats'] as const,
    preferences: ['user', 'preferences'] as const,
  },
} as const
