import { describe, it, expect } from 'vitest'
import { createLinkSchema, updateLinkSchema, deleteLinkSchema } from './links'

describe('createLinkSchema', () => {
  it('should accept valid URL', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid URL with optional title', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
      title: 'Example Website',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Example Website')
    }
  })

  it('should accept valid URL with optional rating', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
      rating: 4,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rating).toBe(4)
    }
  })

  it('should reject missing URL', () => {
    const result = createLinkSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      // Zod returns a generic "Required" message for missing required fields
      expect(result.error.issues[0].message).toBeTruthy()
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })

  it('should reject invalid URL format', () => {
    const result = createLinkSchema.safeParse({
      url: 'not-a-valid-url',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid URL format')
    }
  })

  it('should reject rating below 1', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
      rating: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject rating above 5', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
      rating: 6,
    })
    expect(result.success).toBe(false)
  })

  it('should accept URLs with various protocols', () => {
    const urls = [
      'https://example.com',
      'http://example.com',
      'https://subdomain.example.com',
      'https://example.com/path/to/page',
      'https://example.com?query=param',
      'https://example.com#anchor',
    ]

    urls.forEach((url) => {
      const result = createLinkSchema.safeParse({ url })
      expect(result.success).toBe(true)
    })
  })
})

describe('updateLinkSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000'

  it('should accept valid update with UUID', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid update with title', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      title: 'Updated Title',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated Title')
    }
  })

  it('should accept valid update with ai_description', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      ai_description: 'This is an AI-generated description',
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid update with rating', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      rating: 3,
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid update with null rating', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      rating: null,
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUID', () => {
    const result = updateLinkSchema.safeParse({
      id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing ID', () => {
    const result = updateLinkSchema.safeParse({
      title: 'Some title',
    })
    expect(result.success).toBe(false)
  })

  it('should reject ai_description longer than 280 characters', () => {
    const longDescription = 'a'.repeat(281)
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      ai_description: longDescription,
    })
    expect(result.success).toBe(false)
  })

  it('should accept ai_description exactly 280 characters', () => {
    const exactDescription = 'a'.repeat(280)
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      ai_description: exactDescription,
    })
    expect(result.success).toBe(true)
  })

  it('should reject rating below 1', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      rating: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject rating above 5', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      rating: 6,
    })
    expect(result.success).toBe(false)
  })

  it('should accept all fields together', () => {
    const result = updateLinkSchema.safeParse({
      id: validUuid,
      title: 'New Title',
      ai_description: 'AI description',
      rating: 5,
    })
    expect(result.success).toBe(true)
  })
})

describe('deleteLinkSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000'

  it('should accept valid UUID', () => {
    const result = deleteLinkSchema.safeParse({
      id: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUID', () => {
    const result = deleteLinkSchema.safeParse({
      id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing ID', () => {
    const result = deleteLinkSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject empty string ID', () => {
    const result = deleteLinkSchema.safeParse({
      id: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject numeric ID', () => {
    const result = deleteLinkSchema.safeParse({
      id: 12345,
    })
    expect(result.success).toBe(false)
  })
})
