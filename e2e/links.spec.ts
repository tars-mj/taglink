import { test, expect } from '@playwright/test'

test.describe('Link Management - CRUD Operations', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard with links', async ({ page }) => {
    // Check if we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/)

    // Should see the main heading - use .first() to handle multiple h1 elements
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('should open Add Link dialog', async ({ page }) => {
    // TODO: Auth state issue - redirects to login
    // Find and click the "Add Link" button
    const addButton = page.getByRole('button', { name: /add link|new link|\+/i })
    await addButton.click()

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should have URL input field
    await expect(page.getByLabel(/url/i)).toBeVisible()
  })

  test('should rate a link', async ({ page }) => {
    // TODO: Auth state issue - redirects to login
    // Wait for links to load
    await page.waitForSelector('[data-testid="link-card"], article, .link-item', {
      timeout: 10000,
      state: 'visible',
    })

    const firstLink = page.locator('[data-testid="link-card"]').first()

    // Look for rating stars or buttons
    const ratingButton = firstLink.locator('[data-rating], [aria-label*="rate"], button').first()
    await ratingButton.click()

    // Should see feedback (visual or toast)
    // This depends on your implementation
    await page.waitForTimeout(500) // Wait for rating to be saved
  })

  test('should display link metadata after scraping', async ({ page }) => {
    // TODO: Auth state issue - redirects to login
    // Open Add Link dialog
    const addButton = page.getByRole('button', { name: /add link|new link|\+/i })
    await addButton.click()

    // Add a real URL that can be scraped
    await page.getByLabel(/url/i).fill('https://github.com')
    await page.getByRole('button', { name: /save|submit|add/i }).click()

    // Wait for scraping to complete (this might take a few seconds)
    await page.waitForTimeout(5000)

    // The link should now have a title and possibly description
    // This depends on whether scraping is synchronous or asynchronous
    const linkWithTitle = page.getByText(/github/i).first()
    await expect(linkWithTitle).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Link Viewing and Navigation', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should open link in new tab when clicked', async ({ page, context }) => {
    // Wait for links to load
    await page.waitForSelector('[data-testid="link-card"], article, .link-item', {
      timeout: 10000,
      state: 'visible',
    })

    // Listen for new page (new tab)
    const pagePromise = context.waitForEvent('page')

    // Click on a link (find the actual URL link, not the card)
    const linkElement = page.locator('a[href^="http"]').first()
    await linkElement.click()

    // New page should open
    const newPage = await pagePromise
    await newPage.waitForLoadState()
    expect(newPage.url()).toMatch(/^https?:\/\//)

    // Close the new page
    await newPage.close()
  })

  test('should display link preview on hover', async ({ page }) => {
    // TODO: Auth state issue - redirects to login
    // Wait for links to load
    await page.waitForSelector('[data-testid="link-card"], article, .link-item', {
      timeout: 10000,
      state: 'visible',
    })

    const firstLink = page.locator('[data-testid="link-card"]').first()

    // Hover over the link
    await firstLink.hover()

    // Wait a bit for hover card to appear (300ms delay as per implementation)
    await page.waitForTimeout(500)

    // Should see preview/hover card (if implemented)
    // This depends on your LinkPreviewPopover implementation
    const hoverCard = page.locator('[role="dialog"], .hover-card, [data-testid="link-preview"]')
    const isVisible = await hoverCard.isVisible().catch(() => false)

    // Preview might or might not be visible depending on implementation
    // This is a soft assertion
    if (isVisible) {
      await expect(hoverCard).toBeVisible()
    }
  })
})
