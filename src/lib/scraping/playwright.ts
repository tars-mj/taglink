import { chromium, Browser, Page } from 'playwright'

/**
 * Scraped metadata from a webpage
 */
export interface ScrapedMetadata {
  url: string
  title: string | null
  description: string | null
  domain: string
  favicon: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  scrapedContent: string | null
  success: boolean
  error?: string
}

/**
 * Scraping configuration options
 */
export interface ScrapingOptions {
  timeout?: number // Max time in milliseconds (default: 30000)
  userAgent?: string
  waitForSelector?: string // Optional selector to wait for
}

/**
 * Default configuration
 */
const DEFAULT_OPTIONS: Required<Omit<ScrapingOptions, 'waitForSelector'>> = {
  timeout: 30000, // 30 seconds
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
 * Extract favicon URL from page or construct default
 */
async function extractFavicon(page: Page, domain: string): Promise<string | null> {
  try {
    // Try to find link rel="icon" or rel="shortcut icon"
    const faviconLink = await page.$('link[rel*="icon"]')
    if (faviconLink) {
      const href = await faviconLink.getAttribute('href')
      if (href) {
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
    }

    // Fallback to default favicon location
    return `https://${domain}/favicon.ico`
  } catch {
    return `https://${domain}/favicon.ico`
  }
}

/**
 * Extract meta tag content
 */
async function getMetaContent(page: Page, property: string): Promise<string | null> {
  try {
    const element = await page.$(`meta[property="${property}"], meta[name="${property}"]`)
    if (element) {
      return await element.getAttribute('content')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extract first 500 words of text content from page
 */
async function extractTextContent(page: Page): Promise<string | null> {
  try {
    // Remove script, style, and other non-content elements
    await page.evaluate(() => {
      const selectors = ['script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer']
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => el.remove())
      })
    })

    // Extract text from main content areas
    const textContent = await page.evaluate(() => {
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.post-content',
        '.article-content',
        'body',
      ]

      for (const selector of contentSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          return element.textContent || ''
        }
      }

      return document.body.textContent || ''
    })

    if (!textContent) return null

    // Clean up text: remove extra whitespace, newlines
    const cleanText = textContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000) // Get more than 500 words to ensure we have enough

    // Split into words and take first 500
    const words = cleanText.split(/\s+/)
    const first500Words = words.slice(0, 500).join(' ')

    return first500Words || null
  } catch (error) {
    console.error('Error extracting text content:', error)
    return null
  }
}

/**
 * Main scraping function
 * Scrapes metadata from a given URL using Playwright
 */
export async function scrapeUrl(
  url: string,
  options: ScrapingOptions = {}
): Promise<ScrapedMetadata> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let browser: Browser | null = null
  let page: Page | null = null

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
    // Launch browser with minimal resources
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    // Create context with custom user agent
    const context = await browser.newContext({
      userAgent: config.userAgent,
      viewport: { width: 1280, height: 720 },
    })

    page = await context.newPage()

    // Set timeout for navigation
    page.setDefaultTimeout(config.timeout)

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.timeout,
    })

    // Wait for optional selector if specified
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, {
        timeout: 5000,
      })
    }

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000)

    // Extract metadata
    result.title = (await page.title()) || null
    result.description = await getMetaContent(page, 'description')
    result.ogTitle = await getMetaContent(page, 'og:title')
    result.ogDescription = await getMetaContent(page, 'og:description')
    result.ogImage = await getMetaContent(page, 'og:image')
    result.favicon = await extractFavicon(page, domain)
    result.scrapedContent = await extractTextContent(page)

    result.success = true

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    result.error = errorMessage
    result.success = false

    // Log error for debugging
    console.error(`Scraping failed for ${url}:`, errorMessage)

    return result
  } finally {
    // Clean up resources
    try {
      if (page) await page.close()
      if (browser) await browser.close()
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
    }
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
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      return { valid: false, reason: 'Localhost URLs cannot be scraped' }
    }

    // Check for IP addresses (might be restricted)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipPattern.test(urlObj.hostname)) {
      return { valid: false, reason: 'IP addresses are not supported' }
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }
}

/**
 * Batch scraping (for future use)
 * Scrapes multiple URLs with controlled concurrency
 */
export async function scrapeUrls(
  urls: string[],
  options: ScrapingOptions & { concurrency?: number } = {}
): Promise<ScrapedMetadata[]> {
  const concurrency = options.concurrency || 3
  const results: ScrapedMetadata[] = []

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map((url) => scrapeUrl(url, options)))
    results.push(...batchResults)
  }

  return results
}
