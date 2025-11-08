import { z } from 'zod'

// Validation schemas for links
export const createLinkSchema = z.object({
  url: z.string().url('Invalid URL format').min(1, 'URL is required'),
  title: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
})

export const updateLinkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  ai_description: z.string().max(280).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
})

export const deleteLinkSchema = z.object({
  id: z.string().uuid(),
})
