'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export interface LinkStatistics {
  totalLinks: number
  linksByRating: {
    rating: number | null
    count: number
  }[]
  averageRating: number | null
  mostUsedTags: {
    id: string
    name: string
    count: number
  }[]
  recentLinksCount: number // Links added in last 7 days
  completedLinks: number
  failedLinks: number
}

export async function getLinkStatistics(): Promise<{
  success: boolean
  data?: LinkStatistics
  error?: string
}> {
  try {
    const supabase = await createServerActionClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 1. Total links count
    const { count: totalLinks, error: countError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (countError) throw countError

    // 2. Links by rating distribution
    const { data: ratingData, error: ratingError } = await supabase
      .from('links')
      .select('rating')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (ratingError) throw ratingError

    // Group by rating
    const ratingCounts = new Map<number | null, number>()
    let totalRating = 0
    let ratedLinksCount = 0

    ratingData?.forEach((link) => {
      const rating = link.rating
      ratingCounts.set(rating, (ratingCounts.get(rating) || 0) + 1)
      if (rating !== null) {
        totalRating += rating
        ratedLinksCount++
      }
    })

    const linksByRating = Array.from(ratingCounts.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => {
        if (a.rating === null) return 1
        if (b.rating === null) return -1
        return b.rating - a.rating
      })

    // 3. Average rating
    const averageRating = ratedLinksCount > 0 ? totalRating / ratedLinksCount : null

    // 4. Most used tags
    const { data: tagUsageData, error: tagError } = await supabase
      .from('link_tags')
      .select(
        `
        tag_id,
        tags (
          id,
          name
        ),
        link_id,
        links!inner (
          user_id,
          deleted_at
        )
      `
      )
      .eq('links.user_id', user.id)
      .is('links.deleted_at', null)

    if (tagError) throw tagError

    // Count tag usage
    const tagCounts = new Map<string, { id: string; name: string; count: number }>()
    tagUsageData?.forEach((item: any) => {
      if (item.tags) {
        const tagId = item.tags.id
        const tagName = item.tags.name
        if (tagCounts.has(tagId)) {
          tagCounts.get(tagId)!.count++
        } else {
          tagCounts.set(tagId, { id: tagId, name: tagName, count: 1 })
        }
      }
    })

    const mostUsedTags = Array.from(tagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 5. Recent links (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentLinksCount, error: recentError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('created_at', sevenDaysAgo.toISOString())

    if (recentError) throw recentError

    // 6. Processing status counts
    const { count: completedLinks, error: completedError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('ai_processing_status', 'completed')

    if (completedError) throw completedError

    const { count: failedLinks, error: failedError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('ai_processing_status', 'failed')

    if (failedError) throw failedError

    return {
      success: true,
      data: {
        totalLinks: totalLinks || 0,
        linksByRating,
        averageRating,
        mostUsedTags,
        recentLinksCount: recentLinksCount || 0,
        completedLinks: completedLinks || 0,
        failedLinks: failedLinks || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching link statistics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
