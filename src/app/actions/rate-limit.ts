'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export interface RateLimitStatus {
  limit: number
  used: number
  remaining: number
  resetAt: string // ISO timestamp when limit resets
  percentageUsed: number
}

/**
 * Get current rate limit status for authenticated user
 * Rate limit: 30 links per hour
 */
export async function getRateLimitStatus(): Promise<{
  success: boolean
  data?: RateLimitStatus
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

  const RATE_LIMIT = 30 // links per hour
  const ONE_HOUR_MS = 60 * 60 * 1000

  // Calculate time window
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - ONE_HOUR_MS)
  const resetAt = new Date(now.getTime() + ONE_HOUR_MS)

  try {
    // Count links created in the last hour
    const { count, error: countError } = await supabase
      .from('links')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo.toISOString())

    if (countError) {
      console.error('Error checking rate limit:', countError)
      return { success: false, error: 'Failed to check rate limit' }
    }

    const used = count || 0
    const remaining = Math.max(0, RATE_LIMIT - used)
    const percentageUsed = Math.round((used / RATE_LIMIT) * 100)

    return {
      success: true,
      data: {
        limit: RATE_LIMIT,
        used,
        remaining,
        resetAt: resetAt.toISOString(),
        percentageUsed,
      },
    }
  } catch (error) {
    console.error('Unexpected error in getRateLimitStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get recent rate limit violations for authenticated user
 */
export async function getRateLimitViolations(limit = 10): Promise<{
  success: boolean
  data?: Array<{
    id: string
    violation_type: string
    attempted_at: string
    details: any
  }>
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

  try {
    const { data: violations, error } = await supabase
      .from('rate_limit_violations')
      .select('id, violation_type, attempted_at, details')
      .eq('user_id', user.id)
      .order('attempted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching violations:', error)
      return { success: false, error: 'Failed to fetch violations' }
    }

    return { success: true, data: violations || [] }
  } catch (error) {
    console.error('Unexpected error in getRateLimitViolations:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
