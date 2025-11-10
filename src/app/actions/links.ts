'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createLinkSchema, updateLinkSchema, deleteLinkSchema } from '@/lib/validations/links'
import { smartScrapeUrl, isUrlScrapable } from '@/lib/scraping'
import { generateDescriptionAndTags, isAIEnabled } from '@/lib/ai/openrouter'
import type { z } from 'zod'
import { generateNewTags } from '@/lib/ai/openrouter'

/**
 * Helper function to truncate string to max length
 * @param str - String to truncate
 * @param maxLength - Maximum length (default 500 for database varchar(500))
 * @returns Truncated string
 */
function truncateString(str: string | null | undefined, maxLength: number = 500): string | null {
  if (!str) return null
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

/**
 * Helper function to create tags from AI-generated tag names
 * - Validates each tag (max 2 words)
 * - Checks if tag already exists (case-insensitive)
 * - Creates new tag in database if it doesn't exist
 * - Returns array of tag IDs (both existing and newly created)
 */
async function createTagsFromAI(
  userId: string,
  tagNames: string[],
  supabase: Awaited<ReturnType<typeof createServerActionClient>>
): Promise<string[]> {
  const tagIds: string[] = []

  for (const tagName of tagNames) {
    // Validate tag format (max 2 words)
    const words = tagName.trim().split(/\s+/)
    if (words.length > 2) {
      console.warn(`Tag "${tagName}" has more than 2 words, skipping`)
      continue
    }

    // Validate tag format (lowercase, alphanumeric, spaces, hyphens)
    if (!/^[a-z0-9\s-]+$/.test(tagName)) {
      console.warn(`Tag "${tagName}" has invalid format, skipping`)
      continue
    }

    // Check if tag already exists (case-insensitive)
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', tagName)
      .single()

    if (existingTag) {
      console.log(`Tag "${tagName}" already exists, using existing ID`)
      tagIds.push(existingTag.id)
      continue
    }

    // Create new tag
    const { data: newTag, error: tagError } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: tagName,
      })
      .select('id')
      .single()

    if (tagError) {
      console.error(`Error creating tag "${tagName}":`, tagError)
      continue
    }

    if (newTag) {
      console.log(`Created new tag "${tagName}" with ID: ${newTag.id}`)
      tagIds.push(newTag.id)
    }
  }

  return tagIds
}

// Server actions
export async function createLink(formData: FormData) {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const url = formData.get('url') as string
  const titleRaw = formData.get('title') as string | null
  const title = titleRaw && titleRaw.trim() !== '' ? titleRaw.trim() : undefined
  const rating = formData.get('rating')
    ? parseInt(formData.get('rating') as string)
    : undefined

  const validation = createLinkSchema.safeParse({ url, title, rating })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  // Check for duplicate URL
  const { data: existingLink } = await supabase
    .from('links')
    .select('id, url')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .eq('normalized_url', url.toLowerCase())
    .single()

  if (existingLink) {
    return {
      success: false,
      error: 'You have already saved this link',
    }
  }

  // Check rate limit (30 links per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)

  if (count !== null && count >= 30) {
    // Log rate limit violation
    await supabase.from('rate_limit_violations').insert({
      user_id: user.id,
      violation_type: 'links_per_hour',
      details: { url, attempted_at: new Date().toISOString() },
    })

    return {
      success: false,
      error: 'Rate limit exceeded. You can add up to 30 links per hour.',
    }
  }

  // Check if URL is scrapable
  const scrapableCheck = isUrlScrapable(url)
  if (!scrapableCheck.valid) {
    return {
      success: false,
      error: scrapableCheck.reason || 'URL cannot be scraped',
    }
  }

  // Scrape the URL synchronously before saving
  let scrapedData = null
  let scrapingError = null

  try {
    console.log(`Starting synchronous scraping for URL: ${url}`)
    const startTime = new Date()
    scrapedData = await smartScrapeUrl(url, { timeout: 30000 })
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    console.log(`Scraping completed in ${duration}ms`)
  } catch (error) {
    console.error('Scraping error:', error)
    scrapingError = error instanceof Error ? error.message : 'Unknown scraping error'
  }

  // AI Processing: Generate description and suggest tags
  let aiDescription = scrapedData?.success ? (scrapedData.description || scrapedData.ogDescription) : null
  let suggestedTagIds: string[] = []
  // Truncate error immediately to prevent database overflow (varchar(500) limit)
  let aiProcessingError = scrapedData?.success ? null : truncateString(scrapedData?.error || scrapingError || 'Scraping failed', 500)

  if (scrapedData?.success && isAIEnabled()) {
    try {
      console.log('Starting AI processing...')
      const aiStartTime = new Date()

      // Get user's tags for suggestions
      const { data: userTags } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

      const aiResult = await generateDescriptionAndTags(
        {
          title: scrapedData.title || scrapedData.ogTitle,
          description: scrapedData.description || scrapedData.ogDescription,
          scrapedContent: scrapedData.scrapedContent,
          url: url,
        },
        userTags || []
      )

      const aiEndTime = new Date()
      const aiDuration = aiEndTime.getTime() - aiStartTime.getTime()
      console.log(`AI processing completed in ${aiDuration}ms`)

      // Use AI-generated description if available
      if (aiResult.description.success) {
        aiDescription = aiResult.description.description
        console.log(`AI description generated: ${aiDescription.substring(0, 50)}...`)
      } else {
        console.warn(`AI description failed: ${aiResult.description.error}`)
        aiProcessingError = aiProcessingError || truncateString(aiResult.description.error, 500)
      }

      // Store suggested tag IDs for assignment
      if (aiResult.tags.success) {
        suggestedTagIds = aiResult.tags.tagIds
        console.log(`AI suggested ${suggestedTagIds.length} tags`)

        // Fallback: If no existing tags matched, generate new tags
        if (aiResult.tags.needsNewTags && suggestedTagIds.length === 0) {
          console.log('No matching tags found, generating new tags...')
          try {
            const newTagsResult = await generateNewTags({
              title: scrapedData.title || scrapedData.ogTitle,
              description: scrapedData.description || scrapedData.ogDescription,
              scrapedContent: scrapedData.scrapedContent,
              url: url,
            })

            if (newTagsResult.success && newTagsResult.tagNames.length > 0) {
              console.log(`AI generated ${newTagsResult.tagNames.length} new tags: ${newTagsResult.tagNames.join(', ')}`)

              // Create tags in database
              const newTagIds = await createTagsFromAI(user.id, newTagsResult.tagNames, supabase)

              if (newTagIds.length > 0) {
                suggestedTagIds = newTagIds
                console.log(`Created ${newTagIds.length} new tags in database`)
              }
            } else {
              console.warn(`Failed to generate new tags: ${newTagsResult.success ? 'No tags returned' : newTagsResult.error}`)
            }
          } catch (newTagError) {
            console.error('Error generating new tags:', newTagError)
          }
        }
      } else {
        console.warn(`AI tag suggestions failed: ${aiResult.tags.error}`)
      }
    } catch (error) {
      console.error('AI processing error:', error)
      aiProcessingError = truncateString(error instanceof Error ? error.message : 'AI processing failed', 500)
    }
  } else if (!isAIEnabled()) {
    console.log('AI service is not enabled')
  }

  // Prepare link data with scraped metadata and AI-enhanced description
  const linkData = {
    user_id: user.id,
    url: url,
    normalized_url: url.toLowerCase(), // Required for uniqueness checks
    title: truncateString(title || (scrapedData?.success ? (scrapedData.title || scrapedData.ogTitle) : null) || null),
    ai_description: truncateString(aiDescription, 280), // DB limit: varchar(280)
    scraped_content: truncateString(scrapedData?.success ? scrapedData.scrapedContent : null, 3000), // DB limit: varchar(3000)
    domain: scrapedData?.success ? scrapedData.domain : null,
    rating: rating || null,
    ai_processing_status: scrapedData?.success ? 'completed' : 'failed',
    ai_processing_started_at: new Date().toISOString(),
    ai_processing_completed_at: new Date().toISOString(),
    ai_processing_error: aiProcessingError, // Already truncated above
  }

  // Insert link with all metadata already populated
  const { data: newLink, error: insertError } = await supabase
    .from('links')
    .insert(linkData)
    .select()
    .single()

  if (insertError) {
    console.error('Error creating link:', insertError)
    return { success: false, error: 'Failed to create link' }
  }

  console.log(`Link created with status: ${linkData.ai_processing_status}`)

  // Assign suggested tags to the link if available
  if (newLink && suggestedTagIds.length > 0) {
    try {
      const tagAssignments = suggestedTagIds.map(tagId => ({
        link_id: newLink.id,
        tag_id: tagId,
      }))

      const { error: tagError } = await supabase
        .from('link_tags')
        .insert(tagAssignments)

      if (tagError) {
        console.error('Error assigning tags:', tagError)
      } else {
        console.log(`Assigned ${suggestedTagIds.length} tags to link`)
      }
    } catch (error) {
      console.error('Error in tag assignment:', error)
    }
  }

  revalidatePath('/dashboard')
  return { success: true, data: newLink }
}

// Helper function to remove undefined values from objects
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value
    }
    return acc
  }, {} as Partial<T>)
}

export async function updateLink(data: z.infer<typeof updateLinkSchema>) {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const validation = updateLinkSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  // Build update object with only defined fields
  const { id, ...fieldsToUpdate } = data
  const updateData = removeUndefined({
    title: fieldsToUpdate.title ? truncateString(fieldsToUpdate.title) : undefined,
    ai_description: fieldsToUpdate.ai_description ? truncateString(fieldsToUpdate.ai_description, 280) : undefined,
    rating: fieldsToUpdate.rating,
  })

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No fields to update' }
  }

  // Update link
  const { error: updateError } = await supabase
    .from('links')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating link:', updateError)
    return { success: false, error: 'Failed to update link' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteLink(linkId: string) {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const validation = deleteLinkSchema.safeParse({ id: linkId })
  if (!validation.success) {
    return { success: false, error: 'Invalid link ID' }
  }

  // Soft delete (set deleted_at timestamp)
  const { error: deleteError } = await supabase
    .from('links')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', linkId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error deleting link:', deleteError)
    return { success: false, error: 'Failed to delete link' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
