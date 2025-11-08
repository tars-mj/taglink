'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { UpdatePreferencesInput, UserPreferences } from '@/types'

// Validation schema
const updatePreferencesSchema = z.object({
  default_view: z.enum(['grid', 'list']).optional(),
  links_per_page: z.union([z.literal(12), z.literal(24), z.literal(48)]).optional(),
  default_sort: z.enum(['rating-desc', 'date-desc', 'date-asc', 'relevance']).optional(),
  ai_processing_enabled: z.boolean().optional(),
})

/**
 * Get user preferences (creates default if not exists)
 */
export async function getUserPreferences() {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Call helper function to get or create preferences
  const { data, error } = await supabase
    .rpc('get_or_create_user_preferences', { p_user_id: user.id })
    .single()

  if (error) {
    console.error('Error fetching preferences:', error)
    return { success: false, error: 'Failed to fetch preferences' }
  }

  return { success: true, data: data as UserPreferences }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(formData: FormData) {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Parse and validate form data
  const rawData: UpdatePreferencesInput = {
    default_view: formData.get('default_view') as 'grid' | 'list' | undefined,
    links_per_page: formData.get('links_per_page')
      ? Number(formData.get('links_per_page')) as 12 | 24 | 48
      : undefined,
    default_sort: formData.get('default_sort') as 'rating-desc' | 'date-desc' | 'date-asc' | 'relevance' | undefined,
    ai_processing_enabled: formData.get('ai_processing_enabled') === 'true',
  }

  // Remove undefined values
  const updateData = Object.fromEntries(
    Object.entries(rawData).filter(([, v]) => v !== undefined)
  )

  const validated = updatePreferencesSchema.safeParse(updateData)
  if (!validated.success) {
    return {
      success: false,
      error: 'Invalid preferences data',
      details: validated.error.issues
    }
  }

  // Update preferences
  const { error } = await supabase
    .from('user_preferences')
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating preferences:', error)
    return { success: false, error: 'Failed to update preferences' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')

  return { success: true }
}

/**
 * Reset preferences to defaults
 */
export async function resetUserPreferences() {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('user_preferences')
    .update({
      default_view: 'grid',
      links_per_page: 12,
      default_sort: 'rating-desc',
      ai_processing_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error resetting preferences:', error)
    return { success: false, error: 'Failed to reset preferences' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')

  return { success: true }
}
