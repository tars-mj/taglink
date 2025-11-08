/**
 * Lightweight scraping module for production environments
 * Uses node-fetch for basic HTML scraping without browser dependencies
 */

import { ScrapedMetadata } from './playwright'

/**
 * Parse HTML meta tags using regex (lightweight alternative to DOM parsing)
 */
function extractMetaTag(html: string, property: string): string | null {
  // Try property attribute first
  let regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
  let match = html.match(regex)

  if (!match) {
    // Try name attribute
    regex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
    match = html.match(regex)
  }

  if (!match) {
    // Try content first pattern
    regex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
    match = html.match(regex)
  }

  return match ? match[1] : null
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : null
}

/**
 * Extract favicon URL
 */
function extractFavicon(html: string, domain: string): string | null {
  // Try to find link rel="icon" or rel="shortcut icon"
  const regex = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i
  const match = html.match(regex)

  if (match && match[1]) {
    const href = match[1]
    // Handle relative URLs
    if (href.startsWith('http')) {
      return href
    } else if (href.startsWith('//')) {
      return `https:${href}`
    } else if (href.startsWith('/')) {
      return `https://${domain}${href}`
    } else {
      return `https://${domain}/${href}`
    }
  }

  // Fallback to default favicon location
  return `https://${domain}/favicon.ico`
}

/**
 * Extract text content from HTML
 */
function extractTextContent(html: string): string | null {
  try {
    // Remove script and style tags
    let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Try to find main content areas
    const contentPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ]

    let contentHtml = ''
    for (const pattern of contentPatterns) {
      const match = cleanHtml.match(pattern)
      if (match && match[1]) {
        contentHtml = match[1]
        break
      }
    }

    // If no content area found, use body
    if (!contentHtml) {
      const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      contentHtml = bodyMatch ? bodyMatch[1] : cleanHtml
    }

    // Remove HTML tags
    let text = contentHtml.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()

    // Get first 500 words
    const words = text.split(/\s+/)
    const first500Words = words.slice(0, 500).join(' ')

    return first500Words || null
  } catch (error) {
    console.error('Error extracting text content:', error)
    return null
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * Lightweight scraping function using fetch
 * No browser dependencies required
 */
export async function scrapeLightweight(
  url: string,
  options: { timeout?: number; userAgent?: string } = {}
): Promise<ScrapedMetadata> {
  const config = {
    timeout: options.timeout || 10000, // 10 seconds default (faster than browser)
    userAgent: options.userAgent ||
      'Mozilla/5.0 (compatible; TagLink/1.0; +https://taglink.app/bot)'
  }

  const domain = extractDomain(url)

  const result: ScrapedMetadata = {
    url,
    title: null,
    description: null,
    domain,
    favicon: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    scrapedContent: null,
    success: false,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('Not an HTML page')
    }

    const html = await response.text()

    // Extract metadata from HTML
    result.title = extractTitle(html)
    result.description = extractMetaTag(html, 'description')
    result.ogTitle = extractMetaTag(html, 'og:title')
    result.ogDescription = extractMetaTag(html, 'og:description')
    result.ogImage = extractMetaTag(html, 'og:image')
    result.favicon = extractFavicon(html, domain)
    result.scrapedContent = extractTextContent(html)

    result.success = true

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    // Simplify error messages for production
    let simplifiedError = errorMessage
    if (errorMessage.includes('aborted')) {
      simplifiedError = 'Request timeout'
    } else if (errorMessage.includes('ENOTFOUND')) {
      simplifiedError = 'Domain not found'
    } else if (errorMessage.includes('ECONNREFUSED')) {
      simplifiedError = 'Connection refused'
    } else if (errorMessage.includes('ETIMEDOUT')) {
      simplifiedError = 'Connection timeout'
    }

    result.error = simplifiedError
    result.success = false

    console.error(`Lightweight scraping failed for ${url}:`, simplifiedError)

    return result
  }
}