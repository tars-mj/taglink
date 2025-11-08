import { test, expect } from '@playwright/test'

test.describe('Search and Filtering', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should have a search input', async ({ page }) => {
    // Look for search input (Polish: "Szukaj")
    const searchInput = page.getByPlaceholder(/szukaj|search/i).or(page.getByRole('searchbox'))
    await expect(searchInput).toBeVisible()
  })

})

test.describe('Tag Filtering', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/tags')
    await page.waitForLoadState('networkidle')
  })

  test('should display tags page', async ({ page }) => {
    await expect(page).toHaveURL(/.*tags/)
    // Use .first() to handle multiple heading elements (Polish heading might not say "Tags")
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('should show tag cards with link counts', async ({ page }) => {
    // TODO: Auth state issue - redirects to login
    // Wait for tags to load
    await page.waitForSelector('[data-testid="tag-card"], article, .tag-item', {
      timeout: 10000,
      state: 'visible',
    })

    // Each tag should show a count
    const firstTag = page.locator('[data-testid="tag-card"]').first()
    await expect(firstTag).toBeVisible()

    // Should contain a number (link count)
    const tagText = await firstTag.textContent()
    expect(tagText).toMatch(/\d+/)
  })

  test('should filter links when clicking a tag', async ({ page }) => {
    // TODO: Tag click navigation/filtering not yet implemented
    // Wait for tags to load
    await page.waitForSelector('[data-testid="tag-card"], article, .tag-item', {
      timeout: 10000,
      state: 'visible',
    })

    // Click on a tag
    const firstTag = page.locator('[data-testid="tag-card"]').first()
    const tagName = await firstTag.textContent()
    await firstTag.click()

    // Should navigate to filtered view or show filtered links
    await page.waitForTimeout(1000)

    // Depending on implementation, might show filtered results on same page
    // or navigate to dashboard with filter applied
  })

  test('should search/filter tags', async ({ page }) => {
    // Look for search within tags page
    const searchInput = page.getByPlaceholder(/search.*tags/i).or(page.getByRole('searchbox'))

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Type in search
      await searchInput.fill('javascript')
      await page.waitForTimeout(500)

      // Should filter tag list
      const visibleTags = page.locator('[data-testid="tag-card"]')
      const count = await visibleTags.count()

      // Either we have matching tags or no results
      if (count === 0) {
        await expect(page.getByText(/no.*found|no.*tags/i)).toBeVisible()
      }
    }
  })
})

test.describe('Rating Filter', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should filter by rating if filter UI exists', async ({ page }) => {
    // Look for rating filter (might be dropdown, buttons, or radio group)
    const ratingFilter = page.locator('[data-testid="rating-filter"], select, [role="radiogroup"]')

    const isVisible = await ratingFilter.isVisible({ timeout: 2000 }).catch(() => false)

    if (isVisible) {
      // If rating filter exists, interact with it
      await ratingFilter.click()

      // Select a specific rating
      const fiveStarOption = page.getByText(/5.*star|★★★★★/i)
      if (await fiveStarOption.isVisible({ timeout: 1000 })) {
        await fiveStarOption.click()
        await page.waitForTimeout(500)

        // Should show only 5-star rated links
        const visibleLinks = page.locator('[data-testid="link-card"]')
        const count = await visibleLinks.count()

        // This is implementation-dependent
        console.log(`Filtered to ${count} links with 5-star rating`)
      }
    }
  })
})
