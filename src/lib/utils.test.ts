import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className utility)', () => {
  it('should merge simple class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes with clsx', () => {
    const result = cn('foo', false && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('should merge Tailwind classes correctly (twMerge)', () => {
    // When classes conflict, twMerge should keep the last one
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('should handle complex Tailwind class merging', () => {
    // More complex example with responsive and state variants
    const result = cn('p-2 hover:bg-blue-500', 'p-4 hover:bg-red-500')
    expect(result).toBe('p-4 hover:bg-red-500')
  })

  it('should handle undefined and null values', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('should handle object notation for conditional classes', () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    })
    expect(result).toBe('foo baz')
  })

  it('should dedupe Tailwind utilities', () => {
    const result = cn('text-sm text-lg')
    expect(result).toBe('text-lg')
  })
})
