import { describe, it, expect } from 'vitest'
import { createTagSchema, assignTagsSchema } from './tags'

describe('createTagSchema', () => {
  it('should accept valid tag name', () => {
    const result = createTagSchema.safeParse({
      name: 'javascript',
    })
    expect(result.success).toBe(true)
  })

  it('should accept tag with numbers', () => {
    const result = createTagSchema.safeParse({
      name: 'web3',
    })
    expect(result.success).toBe(true)
  })

  it('should accept tag with hyphens', () => {
    const result = createTagSchema.safeParse({
      name: 'react-native',
    })
    expect(result.success).toBe(true)
  })

  it('should accept tag with spaces', () => {
    const result = createTagSchema.safeParse({
      name: 'web development',
    })
    expect(result.success).toBe(true)
  })

  it('should accept tag with mixed case', () => {
    const result = createTagSchema.safeParse({
      name: 'JavaScript',
    })
    expect(result.success).toBe(true)
  })

  it('should reject tag shorter than 2 characters', () => {
    const result = createTagSchema.safeParse({
      name: 'a',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 2 characters')
    }
  })

  it('should reject tag longer than 30 characters', () => {
    const longName = 'a'.repeat(31)
    const result = createTagSchema.safeParse({
      name: longName,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at most 30 characters')
    }
  })

  it('should accept tag exactly 30 characters', () => {
    const exactName = 'a'.repeat(30)
    const result = createTagSchema.safeParse({
      name: exactName,
    })
    expect(result.success).toBe(true)
  })

  it('should accept tag exactly 2 characters', () => {
    const result = createTagSchema.safeParse({
      name: 'js',
    })
    expect(result.success).toBe(true)
  })

  it('should reject tag with special characters (exclamation)', () => {
    const result = createTagSchema.safeParse({
      name: 'awesome!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('letters, numbers, spaces, and hyphens')
    }
  })

  it('should reject tag with special characters (underscore)', () => {
    const result = createTagSchema.safeParse({
      name: 'react_native',
    })
    expect(result.success).toBe(false)
  })

  it('should reject tag with special characters (at sign)', () => {
    const result = createTagSchema.safeParse({
      name: '@angular',
    })
    expect(result.success).toBe(false)
  })

  it('should reject tag with special characters (dot)', () => {
    const result = createTagSchema.safeParse({
      name: 'node.js',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty tag name', () => {
    const result = createTagSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing name field', () => {
    const result = createTagSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should handle various valid combinations', () => {
    const validNames = [
      'web',
      'Web Development',
      'react-hooks',
      'nextjs15',
      'TypeScript',
      'AI ML',
      '2024 trends',
    ]

    validNames.forEach((name) => {
      const result = createTagSchema.safeParse({ name })
      expect(result.success).toBe(true)
    })
  })
})

describe('assignTagsSchema', () => {
  const validLinkId = '123e4567-e89b-12d3-a456-426614174000'
  const validTagId1 = '223e4567-e89b-12d3-a456-426614174001'
  const validTagId2 = '323e4567-e89b-12d3-a456-426614174002'

  it('should accept valid linkId and tagIds', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: [validTagId1, validTagId2],
    })
    expect(result.success).toBe(true)
  })

  it('should accept empty tagIds array', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: [],
    })
    expect(result.success).toBe(true)
  })

  it('should accept single tag', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: [validTagId1],
    })
    expect(result.success).toBe(true)
  })

  it('should accept exactly 10 tags (maximum)', () => {
    const tenTagIds = Array.from({ length: 10 }, (_, i) =>
      `${i}23e4567-e89b-12d3-a456-42661417400${i}`
    )
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: tenTagIds,
    })
    expect(result.success).toBe(true)
  })

  it('should reject more than 10 tags', () => {
    const elevenTagIds = Array.from({ length: 11 }, (_, i) =>
      `${i % 10}23e4567-e89b-12d3-a456-42661417400${i % 10}`
    )
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: elevenTagIds,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 10 tags allowed')
    }
  })

  it('should reject invalid linkId UUID', () => {
    const result = assignTagsSchema.safeParse({
      linkId: 'not-a-uuid',
      tagIds: [validTagId1],
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid tagId UUID in array', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: [validTagId1, 'not-a-uuid', validTagId2],
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing linkId', () => {
    const result = assignTagsSchema.safeParse({
      tagIds: [validTagId1],
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing tagIds', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-array tagIds', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: validTagId1, // Should be an array
    })
    expect(result.success).toBe(false)
  })

  it('should reject tagIds with mixed valid and invalid UUIDs', () => {
    const result = assignTagsSchema.safeParse({
      linkId: validLinkId,
      tagIds: [validTagId1, '12345', validTagId2],
    })
    expect(result.success).toBe(false)
  })
})
