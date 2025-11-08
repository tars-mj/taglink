'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import sampleData from '@/sample-data.json'

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
 * Helper function to extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

/**
 * Helper function to create or get existing tag
 * Returns tag ID
 */
async function getOrCreateTag(
  userId: string,
  tagName: string,
  supabase: Awaited<ReturnType<typeof createServerActionClient>>
): Promise<string | null> {
  // Validate tag format (lowercase, alphanumeric, spaces, hyphens)
  const normalizedTagName = tagName.toLowerCase().trim()

  if (!/^[a-z0-9\s-]+$/.test(normalizedTagName)) {
    console.warn(`Tag "${tagName}" has invalid format, skipping`)
    return null
  }

  // Validate tag format (max 2 words)
  const words = normalizedTagName.split(/\s+/)
  if (words.length > 2) {
    console.warn(`Tag "${tagName}" has more than 2 words, skipping`)
    return null
  }

  // Check if tag already exists (case-insensitive)
  const { data: existingTag } = await supabase
    .from('tags')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', normalizedTagName)
    .single()

  if (existingTag) {
    return existingTag.id
  }

  // Create new tag
  const { data: newTag, error: tagError } = await supabase
    .from('tags')
    .insert({
      user_id: userId,
      name: normalizedTagName,
    })
    .select('id')
    .single()

  if (tagError) {
    console.error(`Error creating tag "${tagName}":`, tagError)
    return null
  }

  return newTag?.id || null
}

/**
 * Server action to load sample data for a new user
 * - Reads sample data from src/sample-data.json
 * - Creates all necessary tags first
 * - Creates links with proper metadata
 * - Skips AI processing (data is already prepared)
 * - Bypasses rate limiting (this is system-initiated data)
 */
export async function loadSampleData() {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    console.log(`Starting sample data load for user: ${user.id}`)
    const startTime = Date.now()

    // Check if user already has links
    const { count: existingLinksCount } = await supabase
      .from('links')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (existingLinksCount && existingLinksCount > 0) {
      console.log(`User already has ${existingLinksCount} links, skipping sample data load`)
      return {
        success: false,
        error: 'You already have links in your account. Sample data can only be loaded for new users.',
      }
    }

    // Collect all unique tags from sample data
    const allTagNames = new Set<string>()
    sampleData.forEach((item) => {
      item.tags.forEach((tag) => allTagNames.add(tag))
    })

    console.log(`Found ${allTagNames.size} unique tags in sample data`)

    // Create or get all tags first
    const tagNameToIdMap = new Map<string, string>()
    for (const tagName of allTagNames) {
      const tagId = await getOrCreateTag(user.id, tagName, supabase)
      if (tagId) {
        tagNameToIdMap.set(tagName.toLowerCase(), tagId)
      }
    }

    console.log(`Created/retrieved ${tagNameToIdMap.size} tags`)

    // Create all links with their metadata
    let successCount = 0
    let errorCount = 0

    for (const item of sampleData) {
      try {
        // Check if URL already exists (shouldn't happen for new user, but defensive)
        const { data: existingLink } = await supabase
          .from('links')
          .select('id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .eq('normalized_url', item.url.toLowerCase())
          .single()

        if (existingLink) {
          console.log(`Link already exists: ${item.url}, skipping`)
          continue
        }

        // Prepare link data
        const linkData = {
          user_id: user.id,
          url: item.url,
          title: truncateString(item.title, 500), // DB limit: varchar(500)
          ai_description: truncateString(item.description, 280), // DB limit: varchar(280)
          domain: extractDomain(item.url),
          rating: item.rating,
          // Mark as completed so AI processing doesn't trigger
          ai_processing_status: 'completed' as const,
          ai_processing_started_at: new Date().toISOString(),
          ai_processing_completed_at: new Date().toISOString(),
          ai_processing_error: null,
          scraped_content: null, // Sample data doesn't have scraped content
        }

        // Insert link
        const { data: newLink, error: insertError } = await supabase
          .from('links')
          .insert(linkData)
          .select('id')
          .single()

        if (insertError) {
          console.error(`Error creating link ${item.url}:`, insertError)
          errorCount++
          continue
        }

        if (!newLink) {
          console.error(`No link returned for ${item.url}`)
          errorCount++
          continue
        }

        // Assign tags to the link
        const tagIds = item.tags
          .map((tagName) => tagNameToIdMap.get(tagName.toLowerCase()))
          .filter((id): id is string => id !== null && id !== undefined)

        if (tagIds.length > 0) {
          const tagAssignments = tagIds.map((tagId) => ({
            link_id: newLink.id,
            tag_id: tagId,
          }))

          const { error: tagError } = await supabase
            .from('link_tags')
            .insert(tagAssignments)

          if (tagError) {
            console.error(`Error assigning tags to link ${item.url}:`, tagError)
          } else {
            console.log(`Assigned ${tagIds.length} tags to link: ${item.title}`)
          }
        }

        successCount++
      } catch (error) {
        console.error(`Error processing link ${item.url}:`, error)
        errorCount++
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(
      `Sample data load completed in ${duration}ms: ${successCount} links created, ${errorCount} errors`
    )

    if (successCount === 0) {
      return {
        success: false,
        error: 'Failed to load any sample data. Please try again.',
      }
    }

    revalidatePath('/dashboard')

    return {
      success: true,
      data: {
        linksCreated: successCount,
        tagsCreated: tagNameToIdMap.size,
        errors: errorCount,
        duration,
      },
    }
  } catch (error) {
    console.error('Error loading sample data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load sample data',
    }
  }
}

/**
 * Check if user has any links (to determine if sample data button should be shown)
 */
export async function checkUserHasLinks() {
  const supabase = await createServerActionClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated', hasLinks: false }
  }

  const { count } = await supabase
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  return {
    success: true,
    hasLinks: (count ?? 0) > 0,
    count: count ?? 0,
  }
}
