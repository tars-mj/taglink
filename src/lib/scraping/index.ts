/**
 * Unified scraping module
 * Automatically selects the appropriate scraper based on environment
 */

import { ScrapedMetadata, ScrapingOptions } from './playwright'
import { scrapeLightweight } from './lightweight'

// Check if we're in a production environment (Railway)
const isProduction = process.env.NODE_ENV === 'production'
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined

// Force lightweight mode on Railway or if explicitly set
const useLightweightMode = isRailway || process.env.USE_LIGHTWEIGHT_SCRAPER === 'true'

/**
 * Smart scraping function that selects the appropriate scraper
 * - Uses lightweight scraper on Railway/production to avoid Chromium dependencies
 * - Falls back to lightweight if Playwright fails
 * - Uses Playwright for development/testing for better accuracy
 */
export async function smartScrapeUrl(
  url: string,
  options: ScrapingOptions = {}
): Promise<ScrapedMetadata> {
  console.log(`[Scraper] Mode: ${useLightweightMode ? 'lightweight' : 'playwright'}, URL: ${url}`)

  // Use lightweight scraper in production or on Railway
  if (useLightweightMode) {
    console.log('[Scraper] Using lightweight scraper (no Chromium required)')
    return scrapeLightweight(url, options)
  }

  // Try Playwright first in development
  try {
    console.log('[Scraper] Attempting Playwright scraper')
    const { scrapeUrl } = await import('./playwright')
    const result = await scrapeUrl(url, options)

    if (result.success) {
      console.log('[Scraper] Playwright scraping successful')
      return result
    }

    // If Playwright failed but loaded, try lightweight as fallback
    console.log('[Scraper] Playwright failed, falling back to lightweight')
    return scrapeLightweight(url, options)
  } catch (error) {
    // Playwright not available (missing dependencies), use lightweight
    console.log('[Scraper] Playwright not available, using lightweight:', error instanceof Error ? error.message : 'Unknown error')
    return scrapeLightweight(url, options)
  }
}

/**
 * Validate if URL is scrapable
 * Checks for common patterns that might fail
 */
export function isUrlScrapable(url: string): { valid: boolean; reason?: string } {
  try {
    const urlObj = new URL(url)

    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, reason: 'Only HTTP/HTTPS URLs are supported' }
    }

    // Check for localhost (not scrapable in production)
    if (isProduction && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      return { valid: false, reason: 'Localhost URLs cannot be scraped in production' }
    }

    // Check for private IP addresses in production
    if (isProduction) {
      const ipPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/
      if (ipPattern.test(urlObj.hostname)) {
        return { valid: false, reason: 'Private IP addresses are not supported in production' }
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }
}

// Re-export types for convenience
export type { ScrapedMetadata, ScrapingOptions } from './playwright'