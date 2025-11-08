'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createTagSchema, assignTagsSchema } from '@/lib/validations/tags'

// Server actions
export async function createTag(name: string) {
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
  const validation = createTagSchema.safeParse({ name })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  // Check if tag already exists (case-insensitive)
  const { data: existingTag } = await supabase
    .from('tags')
    .select('id, name')
    .eq('user_id', user.id)
    .ilike('name', name.toLowerCase())
    .single()

  if (existingTag) {
    return {
      success: false,
      error: 'Tag already exists',
      data: existingTag,
    }
  }

  // Create tag
  const { data: newTag, error: insertError } = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name: name.toLowerCase(), // Will be converted to lowercase by trigger anyway
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating tag:', insertError)
    return { success: false, error: 'Failed to create tag' }
  }

  revalidatePath('/dashboard')
  return { success: true, data: newTag }
}

export async function getUserTags() {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated', data: [] }
  }

  // Fetch user's tags with usage count
  const { data: tags, error: fetchError } = await supabase
    .from('tags')
    .select(
      `
      id,
      name,
      created_at,
      link_tags (count)
    `
    )
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (fetchError) {
    console.error('Error fetching tags:', fetchError)
    return { success: false, error: 'Failed to fetch tags', data: [] }
  }

  // Transform the data to include usage count
  const tagsWithCount = tags.map((tag: any) => ({
    ...tag,
    usage_count: tag.link_tags?.[0]?.count || 0,
  }))

  return { success: true, data: tagsWithCount }
}

export async function assignTagsToLink(linkId: string, tagIds: string[]) {
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
  const validation = assignTagsSchema.safeParse({ linkId, tagIds })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  // Verify user owns the link
  const { data: link, error: linkError } = await supabase
    .from('links')
    .select('id')
    .eq('id', linkId)
    .eq('user_id', user.id)
    .single()

  if (linkError || !link) {
    return { success: false, error: 'Link not found' }
  }

  // Remove existing tag associations
  const { error: deleteError } = await supabase
    .from('link_tags')
    .delete()
    .eq('link_id', linkId)

  if (deleteError) {
    console.error('Error removing old tags:', deleteError)
    return { success: false, error: 'Failed to update tags' }
  }

  // Insert new tag associations
  const linkTagsData = tagIds.map((tagId) => ({
    link_id: linkId,
    tag_id: tagId,
  }))

  const { error: insertError } = await supabase.from('link_tags').insert(linkTagsData)

  if (insertError) {
    console.error('Error assigning tags:', insertError)
    return { success: false, error: 'Failed to assign tags' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function renameTag(tagId: string, newName: string) {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate new name
  const validation = createTagSchema.safeParse({ name: newName })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  // Check if new name already exists (case-insensitive)
  const { data: existingTag } = await supabase
    .from('tags')
    .select('id, name')
    .eq('user_id', user.id)
    .ilike('name', newName.toLowerCase())
    .neq('id', tagId) // Exclude current tag
    .single()

  if (existingTag) {
    return {
      success: false,
      error: 'A tag with this name already exists',
    }
  }

  // Update tag name
  const { error: updateError } = await supabase
    .from('tags')
    .update({ name: newName.toLowerCase() })
    .eq('id', tagId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error renaming tag:', updateError)
    return { success: false, error: 'Failed to rename tag' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/tags')
  return { success: true }
}

export async function mergeTags(sourceTagId: string, targetTagId: string) {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify user owns both tags
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('id, name')
    .in('id', [sourceTagId, targetTagId])
    .eq('user_id', user.id)

  if (tagsError || tags.length !== 2) {
    return { success: false, error: 'Tags not found' }
  }

  // Get all link_tags for source tag
  const { data: linkTags, error: linkTagsError } = await supabase
    .from('link_tags')
    .select('link_id')
    .eq('tag_id', sourceTagId)

  if (linkTagsError) {
    console.error('Error fetching link tags:', linkTagsError)
    return { success: false, error: 'Failed to merge tags' }
  }

  if (linkTags && linkTags.length > 0) {
    // For each link with source tag, check if it already has target tag
    for (const linkTag of linkTags) {
      const { data: existing } = await supabase
        .from('link_tags')
        .select('link_id')
        .eq('link_id', linkTag.link_id)
        .eq('tag_id', targetTagId)
        .single()

      // If link doesn't have target tag, add it
      if (!existing) {
        await supabase.from('link_tags').insert({
          link_id: linkTag.link_id,
          tag_id: targetTagId,
        })
      }
    }
  }

  // Delete source tag (will cascade delete its link_tags)
  const { error: deleteError } = await supabase
    .from('tags')
    .delete()
    .eq('id', sourceTagId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error deleting source tag:', deleteError)
    return { success: false, error: 'Failed to complete merge' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/tags')
  return { success: true }
}

export async function deleteTag(tagId: string) {
  const supabase = await createServerActionClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Delete tag (will cascade delete link_tags associations)
  const { error: deleteError } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error deleting tag:', deleteError)
    return { success: false, error: 'Failed to delete tag' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/tags')
  return { success: true }
}
