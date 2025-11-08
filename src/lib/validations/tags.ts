import { z } from 'zod'

// Validation schemas for tags
export const createTagSchema = z.object({
  name: z
    .string()
    .min(2, 'Tag must be at least 2 characters')
    .max(30, 'Tag must be at most 30 characters')
    .regex(/^[a-z0-9\s-]+$/i, 'Tag can only contain letters, numbers, spaces, and hyphens'),
})

export const assignTagsSchema = z.object({
  linkId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).max(10, 'Maximum 10 tags allowed'),
})
