# AI Service - OpenRouter Integration

This directory contains the AI service layer for TagLink, providing intelligent features powered by OpenRouter.ai.

## Overview

The AI service provides two main features:
1. **Description Generation** - Creates concise, informative descriptions (max 280 chars) in Polish
2. **Tag Suggestions** - Suggests 3-10 relevant tags from user's existing tag collection

## Architecture

```
┌─────────────────┐
│  Link Creation  │
│  (Server Action)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Scraping      │  ← Provides content
│   (Playwright)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Service     │  ← Analyzes content
│  (OpenRouter)   │
└────────┬────────┘
         │
         ├─► Description (280 chars)
         └─► Tag IDs (3-10)
```

## Files

### `openrouter.ts`

Main AI service implementation with three exported functions:

#### `isAIEnabled(): boolean`
Checks if OpenRouter API key is configured.

**Returns:** `true` if AI features are available

**Example:**
```typescript
if (isAIEnabled()) {
  // Proceed with AI features
} else {
  // Fallback to non-AI behavior
}
```

#### `generateDescription(content): Promise<Result>`
Generates a concise description from page content.

**Input:**
```typescript
{
  title?: string | null
  description?: string | null
  scrapedContent?: string | null
  url: string
}
```

**Output:**
```typescript
{ success: true, description: string } | { success: false, error: string }
```

**Features:**
- Max 280 characters (enforced)
- 2-3 sentences
- Polish language
- Analyzes title + meta + first 1000 chars

**Example:**
```typescript
const result = await generateDescription({
  title: "Next.js Documentation",
  description: "The React Framework for the Web",
  scrapedContent: "Next.js by Vercel is the full-stack React framework...",
  url: "https://nextjs.org"
})

if (result.success) {
  console.log(result.description)
  // "Next.js to framework React do budowy aplikacji webowych..."
}
```

#### `suggestTags(content, userTags): Promise<Result>`
Suggests relevant tags from user's existing collection.

**Input:**
```typescript
{
  title?: string | null
  description?: string | null
  scrapedContent?: string | null
  url: string
},
userTags: Array<{ id: string; name: string }>
```

**Output:**
```typescript
{ success: true, tagIds: string[] } | { success: false, error: string }
```

**Features:**
- Returns 3-10 tag IDs
- Only suggests from provided `userTags`
- Validates all IDs exist
- Fallback to first 3 tags if <3 suggestions

**Example:**
```typescript
const result = await suggestTags(
  {
    title: "Next.js Tutorial",
    description: "Learn Next.js",
    scrapedContent: "This tutorial covers React, TypeScript...",
    url: "https://example.com"
  },
  [
    { id: "uuid-1", name: "react" },
    { id: "uuid-2", name: "typescript" },
    { id: "uuid-3", name: "frontend" },
    { id: "uuid-4", name: "backend" },
  ]
)

if (result.success) {
  console.log(result.tagIds)
  // ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### `generateDescriptionAndTags(content, userTags): Promise<Results>`
Combined function that runs both operations in parallel.

**Output:**
```typescript
{
  description: { success: true, description: string } | { success: false, error: string },
  tags: { success: true, tagIds: string[] } | { success: false, error: string }
}
```

**Performance:** ~2-5 seconds (both calls in parallel)

**Example:**
```typescript
const results = await generateDescriptionAndTags(content, userTags)

if (results.description.success) {
  // Use AI-generated description
}

if (results.tags.success) {
  // Assign suggested tags
}
```

## Configuration

### Environment Variables

```env
# Required for AI features
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Optional - defaults to Claude 3 Haiku
OPENROUTER_MODEL=anthropic/claude-3-haiku-20240307
```

### Recommended Models

**Production (Cost-optimized):**
- `anthropic/claude-3-haiku-20240307` - Fast, cheap, quality (recommended)
- `openai/gpt-4o-mini` - Alternative option

**Development/Testing:**
- Same as production (both are cheap enough)

**Not Recommended:**
- `openai/gpt-4` - Too expensive ($0.03/1K tokens)
- `anthropic/claude-3-opus` - Overkill for this use case

## Performance

### Token Usage

| Operation | Input Tokens | Output Tokens | Cost (Haiku) |
|-----------|--------------|---------------|--------------|
| Description | ~250 | ~60 | $0.0001 |
| Tags | ~250 | ~40 | $0.0001 |
| **Total** | **~300** | **~100** | **$0.0002** |

### Response Times

- Description generation: 1-3 seconds
- Tag suggestions: 1-3 seconds
- **Parallel execution: 2-5 seconds total**

### Cost Estimates

- Per link: $0.0002
- 100 users × 20 links/month: $0.40/month
- 1,000 users × 20 links/month: $4.00/month

## Error Handling

### Graceful Degradation

All AI functions handle errors gracefully:

```typescript
// AI service not configured
if (!OPENROUTER_API_KEY) {
  return { success: false, error: 'AI service not configured' }
}

// API failure
try {
  const response = await openrouter.chat.completions.create(...)
} catch (error) {
  return { success: false, error: `AI error: ${error.message}` }
}
```

### Integration Points

When integrating, always check for success:

```typescript
const aiResult = await generateDescription(content)

const description = aiResult.success
  ? aiResult.description
  : fallbackDescription // Use scraped metadata
```

## Best Practices

### 1. Always Provide Fallbacks

```typescript
// ✅ Good
const description = aiResult.success
  ? aiResult.description
  : scrapedData.description

// ❌ Bad
const description = aiResult.description // May be undefined!
```

### 2. Validate Tag IDs

```typescript
// ✅ Good - Service validates automatically
const result = await suggestTags(content, userTags)
// All returned IDs are guaranteed to exist in userTags

// ❌ Bad - Don't assume all tags are valid
const tags = aiResponse.tag_ids // May include invalid IDs
```

### 3. Handle Empty User Tags

```typescript
// ✅ Good
if (userTags.length === 0) {
  // Skip AI tag suggestions or create default tags
} else {
  const result = await suggestTags(content, userTags)
}

// ❌ Bad - Will fail with 'No tags available'
const result = await suggestTags(content, [])
```

### 4. Use Parallel Execution

```typescript
// ✅ Good - 2-5s total
const results = await generateDescriptionAndTags(content, userTags)

// ❌ Bad - 4-8s total
const desc = await generateDescription(content)
const tags = await suggestTags(content, userTags)
```

## Testing

### Without API Key

```typescript
// Service will gracefully degrade
process.env.OPENROUTER_API_KEY = undefined

const result = await generateDescription(content)
// { success: false, error: 'AI service not configured' }
```

### With Mock Responses

```typescript
// TODO: Add mock service for testing
// For now, use actual API with test key
```

## Monitoring

### Metrics to Track

1. **Success Rate:** `success === true` percentage
2. **Response Time:** Time to complete AI calls
3. **Token Usage:** Track via OpenRouter dashboard
4. **Cost:** Daily/monthly spend
5. **Error Types:** Common failure reasons

### OpenRouter Dashboard

Access metrics at: https://openrouter.ai/dashboard

- Total requests
- Token usage
- Costs by model
- Error rates
- Response times

## Troubleshooting

### "AI service not configured"

**Cause:** Missing `OPENROUTER_API_KEY`

**Solution:**
```bash
# Get API key from https://openrouter.ai/keys
# Add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### "AI returned empty description"

**Cause:** Model failed to generate content

**Solutions:**
- Check model availability on OpenRouter
- Try different model
- Verify input content is not empty
- Check API quota

### "Invalid JSON response from AI"

**Cause:** Model didn't return valid JSON for tags

**Solutions:**
- Ensure model supports structured output
- Try with different model
- Check if content is processable

### High Token Usage

**Cause:** Long input content

**Solutions:**
- Content is already truncated to 1000 chars
- Consider reducing further if needed
- Use cheaper model (e.g., GPT-4o-mini)

## Future Enhancements

### Planned (Post-MVP)

- [ ] Caching common domain patterns
- [ ] User feedback on AI quality
- [ ] Description regeneration
- [ ] Multilingual support
- [ ] Confidence scores
- [ ] A/B testing different models
- [ ] Cost tracking per user
- [ ] Smart tag creation suggestions

### Under Consideration

- [ ] Embeddings for similarity search
- [ ] Local LLM fallback (Ollama)
- [ ] Streaming responses
- [ ] Batch processing
- [ ] Custom model fine-tuning

## Related Documentation

- **ADR:** [.adr/004-sprint-4-ai-integration.md](../../../.adr/004-sprint-4-ai-integration.md)
- **PRD:** [.ai/prd.md](../../../.ai/prd.md) - Sections 3.2.2, 3.3.2
- **Tech Stack:** [.ai/tech-stack.md](../../../.ai/tech-stack.md)
- **OpenRouter Docs:** https://openrouter.ai/docs

## Support

For questions or issues:
1. Check ADR 004 for detailed design decisions
2. Review OpenRouter documentation
3. Check logs for specific error messages
4. Verify environment variables are set correctly
