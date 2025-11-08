'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
})

/**
 * Get user profile statistics
 */
export async function getUserStats() {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get link count
  const { count: linkCount, error: linkError } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get tag count
  const { count: tagCount, error: tagError } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (linkError || tagError) {
    console.error('Error fetching stats:', linkError || tagError)
    return { success: false, error: 'Failed to fetch statistics' }
  }

  return {
    success: true,
    data: {
      linkCount: linkCount || 0,
      tagCount: tagCount || 0,
      email: user.email || '',
      createdAt: user.created_at,
    }
  }
}

/**
 * Change user password
 */
export async function changePassword(formData: FormData) {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const newPassword = formData.get('newPassword') as string

  const validated = changePasswordSchema.safeParse({ newPassword })
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0].message
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: validated.data.newPassword
  })

  if (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Failed to change password' }
  }

  return { success: true }
}

/**
 * Change user email
 */
export async function changeEmail(formData: FormData) {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const newEmail = formData.get('newEmail') as string

  const validated = changeEmailSchema.safeParse({ newEmail })
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0].message
    }
  }

  const { error } = await supabase.auth.updateUser({
    email: validated.data.newEmail
  })

  if (error) {
    console.error('Error changing email:', error)
    return { success: false, error: error.message }
  }

  return {
    success: true,
    message: 'Confirmation email sent to new address'
  }
}

/**
 * Export user data in various formats
 */
export async function exportUserData(format: 'json' | 'csv' | 'markdown') {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Fetch all user data
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select(`
      *,
      link_tags (
        tags (
          id,
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (linksError) {
    console.error('Error fetching links for export:', linksError)
    return { success: false, error: 'Failed to export data' }
  }

  // Define types for the export data
  type LinkTag = { tags?: { name: string } | null }
  type LinkWithTags = {
    url: string
    title: string | null
    ai_description: string | null
    rating: number | null
    link_tags?: LinkTag[] | null
    created_at: string
  }

  // Transform data for export
  const exportData = (links as LinkWithTags[]).map((link) => ({
    url: link.url,
    title: link.title,
    description: link.ai_description,
    rating: link.rating,
    tags: link.link_tags?.map((lt) => lt.tags?.name).filter(Boolean) || [],
    created: link.created_at,
  }))

  let output = ''
  let mimeType = ''
  let filename = ''

  switch (format) {
    case 'json':
      output = JSON.stringify(exportData, null, 2)
      mimeType = 'application/json'
      filename = `taglink-export-${Date.now()}.json`
      break

    case 'csv':
      // CSV header
      output = 'URL,Title,Description,Rating,Tags,Created\n'
      // CSV rows
      output += exportData.map((item) =>
        `"${item.url}","${item.title || ''}","${item.description || ''}",${item.rating || ''},"${(item.tags as string[]).join('; ')}","${item.created}"`
      ).join('\n')
      mimeType = 'text/csv'
      filename = `taglink-export-${Date.now()}.csv`
      break

    case 'markdown':
      output = '# TagLink Export\n\n'
      output += `Exported: ${new Date().toISOString()}\n\n`
      output += `Total Links: ${exportData.length}\n\n---\n\n`

      exportData.forEach((item, index) => {
        output += `## ${index + 1}. ${item.title || 'Untitled'}\n\n`
        output += `**URL:** ${item.url}\n\n`
        if (item.description) output += `**Description:** ${item.description}\n\n`
        if (item.rating) output += `**Rating:** ${'⭐'.repeat(item.rating)}\n\n`
        if ((item.tags as string[]).length > 0) output += `**Tags:** ${(item.tags as string[]).join(', ')}\n\n`
        output += `**Created:** ${new Date(item.created).toLocaleString()}\n\n`
        output += '---\n\n'
      })
      mimeType = 'text/markdown'
      filename = `taglink-export-${Date.now()}.md`
      break
  }

  return {
    success: true,
    data: {
      content: output,
      mimeType,
      filename,
    }
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(confirmation: string) {
  const supabase = await createServerActionClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Require explicit confirmation
  if (confirmation !== 'DELETE MY ACCOUNT') {
    return {
      success: false,
      error: 'Invalid confirmation text'
    }
  }

  // Delete all user data (cascade will handle relations)
  const { error: linksError } = await supabase
    .from('links')
    .delete()
    .eq('user_id', user.id)

  const { error: tagsError } = await supabase
    .from('tags')
    .delete()
    .eq('user_id', user.id)

  const { error: prefsError } = await supabase
    .from('user_preferences')
    .delete()
    .eq('user_id', user.id)

  if (linksError || tagsError || prefsError) {
    console.error('Error deleting user data:', linksError || tagsError || prefsError)
    return { success: false, error: 'Failed to delete user data' }
  }

  // Delete auth account (this will sign the user out)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('Error deleting account:', deleteError)
    return { success: false, error: 'Failed to delete account' }
  }

  return { success: true }
}
