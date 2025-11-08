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
      systemPrompt: `You are an expert content analyst that suggests ONLY relevant tags for web content.
Your task:
- Carefully analyze the webpage content, title, and URL
- Select ONLY tags that are DIRECTLY relevant to the main topics discussed
- Return 1-5 highly relevant tags (quality over quantity)
- If content is about TypeScript and SQL, ONLY select "typescript" and "sql" tags
- If content is about fashion autumn collection, ONLY select "fashion" and "autumn" tags
- DO NOT select tags just because they exist - they must match the content
- DO NOT create new tags, ONLY use provided tag IDs
- Better to return 1-2 accurate tags than 5-10 irrelevant ones

Output format: {"tag_ids": ["id1", "id2"]}

CRITICAL: Return valid JSON only. ONLY include tags that directly relate to the content's main topics.`,
      userPrompt: `Analyze this webpage and suggest 1-5 ONLY TRULY RELEVANT tags from my existing tags.
Focus on the MAIN TOPICS of the content. Ignore unrelated tags.

Webpage content:
${context}

URL: ${content.url}

Available tags (ID: name):
${tagList}

Return JSON with tag_ids array containing 1-5 tag IDs that match the MAIN TOPICS ONLY.`,
      maxTokens: 200,
      temperature: 0.3,
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
 * Creates exactly 2 highly relevant tags (max 2 words each)
 *
 * @param content - Page content for analysis
 * @returns 2 new tag names (not IDs) or empty array on error
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
      systemPrompt: `You are an expert content analyst that generates highly relevant tags for web content.
Your task:
- Carefully analyze the webpage content, title, and URL
- Generate EXACTLY 2 tags that capture the MAIN TOPICS
- Each tag must be 1-2 words maximum
- Tags must be in ENGLISH
- Tags must be lowercase, simple keywords
- Tags should be generic and widely applicable (e.g., "javascript", "web development", "machine learning")
- DO NOT use special characters, only letters, numbers, spaces, hyphens

Examples of GOOD tags:
- "javascript"
- "web development"
- "machine learning"
- "react"
- "backend"

Examples of BAD tags:
- "how to build a website" (too long)
- "JavaScript Framework Tutorial" (not lowercase, too specific)
- "react.js/next.js" (special characters)

Output format: {"tags": ["tag1", "tag2"]}

CRITICAL: Return valid JSON with EXACTLY 2 tags. Each tag: 1-2 words, lowercase, English.`,
      userPrompt: `Analyze this webpage and generate EXACTLY 2 highly relevant tags (1-2 words each, lowercase, English).

Webpage content:
${context}

URL: ${content.url}

Return JSON with exactly 2 tags that represent the MAIN TOPICS of this content.`,
      maxTokens: 100,
      temperature: 0.3,
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
      .slice(0, 2) // Ensure exactly max 2 tags

    if (validatedTags.length === 0) {
      return { success: false, error: 'AI generated invalid tags' }
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
