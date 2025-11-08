'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  showClear?: boolean
  className?: string
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  showClear = false,
  className,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const handleClick = (star: number) => {
    if (readonly || !onChange) return
    // Toggle: if clicking current rating, clear it
    onChange(value === star ? null : star)
  }

  const displayValue = hoveredStar !== null ? hoveredStar : (value || 0)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className="flex gap-0.5"
        onMouseLeave={() => !readonly && setHoveredStar(null)}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
          const isFilled = star <= displayValue
          const isInteractive = !readonly && onChange

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => isInteractive && setHoveredStar(star)}
              disabled={readonly || !onChange}
              className={cn(
                sizeClasses[size],
                'transition-all',
                isInteractive && 'cursor-pointer hover:scale-110',
                readonly && 'cursor-default'
              )}
              aria-label={`Rate ${star} out of ${max}`}
            >
              <Star
                className={cn(
                  'w-full h-full transition-colors',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300',
                  isInteractive && 'hover:text-yellow-300'
                )}
              />
            </button>
          )
        })}
      </div>
      {showClear && value !== null && onChange && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
