'use client'

import { useEffect, useState } from 'react'
import { getRateLimitStatus, type RateLimitStatus } from '@/app/actions/rate-limit'
import { AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RateLimitIndicatorProps {
  className?: string
  showDetails?: boolean
  variant?: 'compact' | 'detailed'
}

export function RateLimitIndicator({
  className,
  showDetails = false,
  variant = 'compact',
}: RateLimitIndicatorProps) {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRateLimitStatus()
  }, [])

  const loadRateLimitStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getRateLimitStatus()

      if (result.success && result.data) {
        setStatus(result.data)
      } else {
        setError(result.error || 'Failed to load rate limit status')
      }
    } catch (err) {
      console.error('Error loading rate limit:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Refresh status after link operations
  useEffect(() => {
    const handleRefresh = () => {
      loadRateLimitStatus()
    }

    window.addEventListener('rate-limit-refresh', handleRefresh)
    return () => window.removeEventListener('rate-limit-refresh', handleRefresh)
  }, [])

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Clock className="h-4 w-4 animate-spin" />
        <span>Checking limit...</span>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <AlertCircle className="h-4 w-4" />
        <span>Unable to check limit</span>
      </div>
    )
  }

  const isNearLimit = status.percentageUsed >= 80
  const isAtLimit = status.remaining === 0

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <div
          className={cn(
            'flex items-center gap-1.5',
            isAtLimit
              ? 'text-destructive'
              : isNearLimit
              ? 'text-yellow-600'
              : 'text-muted-foreground'
          )}
        >
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            {status.remaining}/{status.limit} remaining
          </span>
        </div>
      </div>
    )
  }

  // Detailed variant
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Rate Limit</span>
        </div>
        <span
          className={cn(
            'font-semibold',
            isAtLimit
              ? 'text-destructive'
              : isNearLimit
              ? 'text-yellow-600'
              : 'text-muted-foreground'
          )}
        >
          {status.remaining} / {status.limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isAtLimit
              ? 'bg-gradient-to-r from-red-500 to-red-600'
              : isNearLimit
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
              : 'bg-gradient-main'
          )}
          style={{ width: `${status.percentageUsed}%` }}
        />
      </div>

      {showDetails && (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Used:</span>
            <span className="font-medium">
              {status.used} {status.used === 1 ? 'link' : 'links'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Resets:</span>
            <span className="font-medium">
              {new Date(status.resetAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            You've reached the limit of {status.limit} links per hour. Please wait until{' '}
            {new Date(status.resetAt).toLocaleTimeString()} to add more links.
          </p>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs text-yellow-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>You're approaching the rate limit. {status.remaining} links remaining.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Helper function to trigger rate limit refresh across components
 */
export function refreshRateLimit() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rate-limit-refresh'))
  }
}
