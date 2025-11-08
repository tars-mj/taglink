/**
 * AI Service
 *
 * Provides AI-powered features using either Anthropic API directly or OpenRouter:
 * - Description generation (max 280 chars)
 * - Tag suggestions from user's existing tags
 * - New tag generation when no existing tags match
 *
 * Supports both Anthropic SDK (recommended) and OpenRouter fallback
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Configuration - Check for Anthropic key first, fallback to OpenRouter
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku-20240307'
const ANTHROPIC_MODEL = 'claude-3-haiku-20240307'

// Determine which provider to use
const USE_ANTHROPIC = !!ANTHROPIC_API_KEY
const USE_OPENROUTER = !USE_ANTHROPIC && !!OPENROUTER_API_KEY

// Validate configuration
if (!USE_ANTHROPIC && !USE_OPENROUTER) {
  console.warn('⚠️ No AI API key configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY. AI features will be disabled.')
}

// Initialize clients
let anthropic: Anthropic | null = null
let openrouter: OpenAI | null = null

if (USE_ANTHROPIC) {
  anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  })
  console.log('✓ Using Anthropic API directly')
}

if (USE_OPENROUTER) {
  openrouter = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'TagLink - AI Link Management',
    },
  })
  console.log('✓ Using OpenRouter API')
}

/**
 * Check if AI service is available
 */
export function isAIEnabled(): boolean {
  return USE_ANTHROPIC || USE_OPENROUTER
}

/**
 * Helper function to call AI with unified interface
 * Supports both Anthropic SDK and OpenRouter
 */
async function callAI(params: {
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  requireJson?: boolean
}): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens, temperature, requireJson = false } = params

  if (USE_ANTHROPIC && anthropic) {
    // Use Anthropic SDK directly
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }
    throw new Error('Unexpected response format from Anthropic')
  }

  if (USE_OPENROUTER && openrouter) {
    // Use OpenRouter with OpenAI SDK
    const response = await openrouter.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      ...(requireJson ? { response_format: { type: 'json_object' } } : {}),
    })

    return response.choices[0]?.message?.content?.trim() || ''
  }

  throw new Error('No AI provider configured')
}

/**
 * Generate a concise description (max 280 chars) from page content
 *
 * @param content - Scraped page content (title, meta, body text)
 * @returns AI-generated description or null on error
 */
export async function generateDescription(content: {
  title?: string | null
  description?: string | null
  scrapedContent?: string | null
  url: string
}): Promise<{ success: true; description: string } | { success: false; error: string }> {
  if (!isAIEnabled()) {
    return { success: false, error: 'AI service not configured' }
  }

  try {
    // Prepare context for AI
    const contextParts = []
    if (content.title) contextParts.push(`Title: ${content.title}`)
    if (content.description) contextParts.push(`Meta: ${content.description}`)
    if (content.scrapedContent) {
      // Limit scraped content to first 1000 chars to save tokens
      const truncated = content.scrapedContent.substring(0, 1000)
      contextParts.push(`Content: ${truncated}`)
    }

    const context = contextParts.join('\n')

    if (!context.trim()) {
      return { success: false, error: 'No content available for description generation' }
    }

    // Call AI
    const generatedDescription = await callAI({
      systemPrompt: `You are a helpful assistant that creates concise, informative descriptions for web links.
Your task is to generate a description that:
- Is EXACTLY 2-3 sentences
- Is MAXIMUM 280 characters (including spaces)
- Captures the essence and value of the content
- Is written in Polish language
- Is clear and easy to understand
- Does NOT include the URL or title verbatim

CRITICAL: The description MUST be 280 characters or less. Count carefully.`,
      userPrompt: `Create a concise description (max 280 chars) for this webpage:\n\n${context}\n\nURL: ${content.url}`,
      maxTokens: 150,
      temperature: 0.7,
    })

    if (!generatedDescription) {
      return { success: false, error: 'AI returned empty description' }
    }

    // Enforce 280 character limit (just in case)
    const finalDescription = generatedDescription.length > 280
      ? generatedDescription.substring(0, 277) + '...'
      : generatedDescription

    return { success: true, description: finalDescription }
  } catch (error) {
    console.error('Error generating description:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `AI error: ${errorMessage}` }
  }
}

/**
 * Suggest tags from user's existing tags based on content
 *
 * @param content - Page content for analysis
 * @param userTags - Array of user's existing tags
 * @returns Suggested tag IDs (1-5 tags), with flag if new tags needed
 */
export async function suggestTags(
  content: {
    title?: string | null
    description?: string | null
    scrapedContent?: string | null
    url: string
  },
  userTags: Array<{ id: string; name: string }>
): Promise<{ success: true; tagIds: string[]; needsNewTags?: boolean } | { success: false; error: string }> {
  if (!isAIEnabled()) {
    return { success: false, error: 'AI service not configured' }
  }

  if (userTags.length === 0) {
    return { success: false, error: 'No tags available for suggestions' }
  }

  try {
    // Prepare content context
    const contextParts = []
    if (content.title) contextParts.push(`Title: ${content.title}`)
    if (content.description) contextParts.push(`Meta: ${content.description}`)
    if (content.scrapedContent) {
      const truncated = content.scrapedContent.substring(0, 1000)
      contextParts.push(`Content: ${truncated}`)
    }

    const context = contextParts.join('\n')

    if (!context.trim()) {
      return { success: false, error: 'No content available for tag suggestions' }
    }

    // Prepare tag list for AI
    const tagList = userTags.map(tag => `${tag.id}: ${tag.name}`).join('\n')

    // Call AI with structured output
    const responseContent = await callAI({
      systemPrompt: `You are an expert content analyst that MUST suggest multiple relevant tags for web content.

MANDATORY REQUIREMENTS:
- You MUST return MINIMUM 3 tags, ideally 4-5 tags
- Analyze ALL aspects: technology, category, purpose, type, concepts
- Be COMPREHENSIVE - better to include more relevant tags than too few
- If you return less than 3 tags, the system will FAIL

Tag selection strategy:
1. Primary topic/technology (e.g., "react", "python")
2. Category/domain (e.g., "frontend", "backend", "database")
3. Content type (e.g., "tutorial", "documentation", "article")
4. Related concepts (e.g., "javascript", "web development")
5. Secondary topics mentioned

Output format: {"tag_ids": ["id1", "id2", "id3", "id4", "id5"]}

CRITICAL: You MUST return AT LEAST 3 tag IDs. Returning less than 3 is a FAILURE.`,
      userPrompt: `IMPORTANT: You MUST select MINIMUM 3 tags from the available tags below.

Analyze this webpage and select 3-5 tags that best describe it:
${context}

URL: ${content.url}

AVAILABLE TAGS TO CHOOSE FROM:
${tagList}

REMEMBER:
- Select AT LEAST 3 tags (returning less is a FAILURE)
- Look for tags matching: main topic, technology, category, type, related concepts
- Be generous with tag selection - better to tag comprehensively

Return JSON with AT LEAST 3 tag IDs from the list above.`,
      maxTokens: 200,
      temperature: 0.5,
      requireJson: true,
    })

    if (!responseContent) {
      return { success: false, error: 'AI returned empty response' }
    }

    // Parse JSON response - handle markdown code blocks
    let parsedResponse: { tag_ids?: string[] }
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = responseContent.trim()
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim()
      }

      parsedResponse = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseContent)
      return { success: false, error: 'Invalid JSON response from AI' }
    }

    const suggestedTagIds = parsedResponse.tag_ids || []

    // Validate tag IDs exist in user's tags
    const validTagIds = suggestedTagIds.filter(id =>
      userTags.some(tag => tag.id === id)
    )

    // Accept 0-5 tags (AI should only suggest truly relevant ones)
    // If AI returns 0 tags, it means no tags are relevant - that's OK
    const finalTagIds = validTagIds.slice(0, 5) // Max 5 tags

    // If no tags matched, signal that new tags should be created
    const needsNewTags = finalTagIds.length === 0 && userTags.length > 0

    return { success: true, tagIds: finalTagIds, needsNewTags }
  } catch (error) {
    console.error('Error suggesting tags:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `AI error: ${errorMessage}` }
  }
}

/**
 * Generate new tags when no existing tags match the content
 * Creates 3-5 highly relevant tags (max 2 words each)
 *
 * @param content - Page content for analysis
 * @returns 3-5 new tag names (not IDs) or empty array on error
 */
export async function generateNewTags(
  content: {
    title?: string | null
    description?: string | null
    scrapedContent?: string | null
    url: string
  }
): Promise<{ success: true; tagNames: string[] } | { success: false; error: string }> {
  if (!isAIEnabled()) {
    return { success: false, error: 'AI service not configured' }
  }

  try {
    // Prepare content context
    const contextParts = []
    if (content.title) contextParts.push(`Title: ${content.title}`)
    if (content.description) contextParts.push(`Meta: ${content.description}`)
    if (content.scrapedContent) {
      const truncated = content.scrapedContent.substring(0, 1000)
      contextParts.push(`Content: ${truncated}`)
    }

    const context = contextParts.join('\n')

    if (!context.trim()) {
      return { success: false, error: 'No content available for tag generation' }
    }

    // Call AI to generate new tags
    const responseContent = await callAI({
      systemPrompt: `You are a tag generation expert. Your task is MANDATORY: generate EXACTLY 3-5 tags.

STRICT REQUIREMENTS:
- You MUST generate MINIMUM 3 tags (NEVER less)
- Maximum 5 tags
- Each tag: 1-2 words, lowercase, English only
- NO special characters (only letters, numbers, spaces, hyphens)

TAG GENERATION STRATEGY (generate tags for ALL these aspects):
1. Main technology/tool (e.g., "react", "python", "docker")
2. Category/domain (e.g., "frontend", "backend", "devops")
3. Content type (e.g., "tutorial", "guide", "documentation")
4. Purpose/use case (e.g., "automation", "analytics", "security")
5. Related concept (e.g., "programming", "web", "database")

GOOD examples:
- React article: ["react", "frontend", "javascript", "tutorial", "web"]
- Python data guide: ["python", "data science", "tutorial", "analytics", "programming"]
- Docker tutorial: ["docker", "devops", "containers", "tutorial", "deployment"]

Output: {"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}

FAILURE CONDITION: Returning less than 3 tags will cause system failure!`,
      userPrompt: `MANDATORY: Generate AT LEAST 3 tags for this webpage (never less than 3!).

Content to analyze:
${context}

URL: ${content.url}

INSTRUCTIONS:
1. Identify the main topic/technology
2. Identify the category (frontend/backend/data/devops/etc)
3. Identify the content type (tutorial/article/documentation/tool/etc)
4. Add 1-2 more relevant tags

YOU MUST RETURN AT LEAST 3 TAGS! Less than 3 is unacceptable.
Return JSON with 3-5 tags, each 1-2 words, lowercase, English.`,
      maxTokens: 150,
      temperature: 0.5,
      requireJson: true,
    })

    if (!responseContent) {
      return { success: false, error: 'AI returned empty response' }
    }

    // Parse JSON response - handle markdown code blocks
    let parsedResponse: { tags?: string[] }
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = responseContent.trim()
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim()
      }

      parsedResponse = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI new tags response:', responseContent)
      return { success: false, error: 'Invalid JSON response from AI' }
    }

    const suggestedTags = parsedResponse.tags || []

    // Validate and clean tags
    const validatedTags = suggestedTags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => {
        // Max 2 words
        const words = tag.split(/\s+/)
        if (words.length > 2) return false

        // Regex validation (letters, numbers, spaces, hyphens)
        if (!/^[a-z0-9\s-]+$/.test(tag)) return false

        // Min 2 chars
        if (tag.length < 2) return false

        return true
      })
      .slice(0, 5) // Ensure max 5 tags

    // Require minimum 3 tags
    if (validatedTags.length < 3) {
      return { success: false, error: 'AI generated too few tags (minimum 3 required)' }
    }

    return { success: true, tagNames: validatedTags }
  } catch (error) {
    console.error('Error generating new tags:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `AI error: ${errorMessage}` }
  }
}

/**
 * Generate both description and tag suggestions in one call
 * Optimized to reduce API calls
 */
export async function generateDescriptionAndTags(
  content: {
    title?: string | null
    description?: string | null
    scrapedContent?: string | null
    url: string
  },
  userTags: Array<{ id: string; name: string }>
): Promise<{
  description: { success: true; description: string } | { success: false; error: string }
  tags: { success: true; tagIds: string[]; needsNewTags?: boolean } | { success: false; error: string }
}> {
  // Run in parallel for better performance
  const [descriptionResult, tagsResult] = await Promise.all([
    generateDescription(content),
    suggestTags(content, userTags),
  ])

  return {
    description: descriptionResult,
    tags: tagsResult,
  }
}
