'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export type SortOption = 'rating' | 'date-desc' | 'date-asc' | 'relevance'

export interface SearchParams {
  query?: string
  tagIds?: string[]
  sortBy?: SortOption
  page?: number
  pageSize?: number
}

export interface SearchResult {
  links: any[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Search and filter links with pagination
 * Implements:
 * - Full-text search across title, description, and tags
 * - Tag filtering with AND logic (all selected tags must match)
 * - Multiple sorting options
 * - Pagination
 */
export async function searchLinks(params: SearchParams = {}): Promise<{
  success: boolean
  data?: SearchResult
  error?: string
}> {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Default values
  const {
    query = '',
    tagIds = [],
    sortBy = 'rating',
    page = 1,
    pageSize = 12,
  } = params

  try {
    // Start building the query
    let queryBuilder = supabase
      .from('links')
      .select(
        `
        *,
        link_tags (
          tag:tags (
            id,
            name
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // Apply full-text search if query provided
    if (query && query.trim()) {
      const searchTerm = query.trim()

      // Search in title and description using ILIKE for simple pattern matching
      // Note: For better performance with large datasets, consider using Postgres full-text search
      queryBuilder = queryBuilder.or(
        `title.ilike.%${searchTerm}%,ai_description.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%`
      )
    }

    // Apply tag filtering with AND logic
    if (tagIds.length > 0) {
      // For AND logic: link must have ALL selected tags
      // We need to use a subquery approach
      // First, get links that have at least one of the selected tags
      const { data: linksWithTags, error: tagError } = await supabase
        .from('link_tags')
        .select('link_id')
        .in('tag_id', tagIds)

      if (tagError) {
        console.error('Error filtering by tags:', tagError)
        return { success: false, error: 'Failed to filter by tags' }
      }

      // Count occurrences of each link_id
      const linkIdCounts = new Map<string, number>()
      linksWithTags?.forEach((item) => {
        const count = linkIdCounts.get(item.link_id) || 0
        linkIdCounts.set(item.link_id, count + 1)
      })

      // Get only links that have ALL selected tags (count equals tagIds.length)
      const validLinkIds = Array.from(linkIdCounts.entries())
        .filter(([_, count]) => count === tagIds.length)
        .map(([linkId]) => linkId)

      if (validLinkIds.length === 0) {
        // No links match all selected tags
        return {
          success: true,
          data: {
            links: [],
            totalCount: 0,
            page,
            pageSize,
            totalPages: 0,
          },
        }
      }

      queryBuilder = queryBuilder.in('id', validLinkIds)
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        // Rating descending (nulls last), then by creation date
        queryBuilder = queryBuilder
          .order('rating', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
        break
      case 'date-desc':
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      case 'date-asc':
        queryBuilder = queryBuilder.order('created_at', { ascending: true })
        break
      case 'relevance':
        // For relevance, we'll use creation date for now
        // In the future, could implement proper relevance scoring
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      default:
        queryBuilder = queryBuilder.order('rating', { ascending: false, nullsFirst: false })
    }

    // Get total count before pagination
    const { count: totalCount } = await queryBuilder

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    queryBuilder = queryBuilder.range(from, to)

    // Execute query
    const { data: links, error: fetchError } = await queryBuilder

    if (fetchError) {
      console.error('Error searching links:', fetchError)
      return { success: false, error: 'Failed to search links' }
    }

    const totalPages = Math.ceil((totalCount || 0) / pageSize)

    return {
      success: true,
      data: {
        links: links || [],
        totalCount: totalCount || 0,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error in searchLinks:', error)
    return { success: false, error: 'An error occurred while searching' }
  }
}

/**
 * Get all user tags for filter UI
 */
export async function getTagsForFilter(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; count: number }>
  error?: string
}> {
  const supabase = await createServerActionClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Fetch tags with link count
  const { data: tags, error: fetchError } = await supabase
    .from('tags')
    .select(
      `
      id,
      name,
      link_tags!inner (
        link:links!inner (
          id
        )
      )
    `
    )
    .eq('user_id', user.id)
    .is('link_tags.link.deleted_at', null)
    .order('name', { ascending: true })

  if (fetchError) {
    console.error('Error fetching tags for filter:', fetchError)
    return { success: false, error: 'Failed to fetch tags' }
  }

  // Count links per tag
  const tagCounts = new Map<string, { id: string; name: string; count: number }>()

  tags?.forEach((tag: any) => {
    if (!tagCounts.has(tag.id)) {
      tagCounts.set(tag.id, {
        id: tag.id,
        name: tag.name,
        count: 0,
      })
    }

    // Count unique links
    const linkIds = new Set(
      tag.link_tags?.map((lt: any) => lt.link?.id).filter(Boolean)
    )
    tagCounts.get(tag.id)!.count = linkIds.size
  })

  const tagsArray = Array.from(tagCounts.values())
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count) // Sort by usage count descending

  return {
    success: true,
    data: tagsArray,
  }
}
