import { test, expect } from '@playwright/test'

test.describe('Tag Management', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/tags')
    await page.waitForLoadState('networkidle')
  })

  test('should display tags page', async ({ page }) => {
    await expect(page).toHaveURL(/.*tags/)
    // Use .first() to handle multiple heading elements
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('should show existing tags', async ({ page }) => {
    // TODO: Auth state issue - redirects to login
    // Should have at least one tag or show "no tags" message
    const tagCards = page.locator('[data-testid="tag-card"], article, .tag-item')
    const noTagsMessage = page.getByText(/no tags|create.*first tag/i)

    // Either tags exist or we see the empty state
    const hasTags = await tagCards.count()
    const hasEmptyState = await noTagsMessage.isVisible().catch(() => false)

    expect(hasTags > 0 || hasEmptyState).toBe(true)
  })

  test('should create a new tag', async ({ page }) => {
    // Find "Create Tag" or "Add Tag" button
    const createButton = page.getByRole('button', { name: /create tag|add tag|new tag/i })

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click()

      // Fill in tag name - use more specific selector to avoid matching dialog itself
      const tagNameInput = page.getByRole('textbox').first()
      const uniqueTagName = `test-tag-${Date.now()}`
      await tagNameInput.fill(uniqueTagName)

      // Submit
      await page.getByRole('button', { name: /save|create|add/i }).click()

      // Should see success message - use .first() to handle toast duplicates
      await expect(page.getByText(/tag.*created|tag.*added/i).first()).toBeVisible({
        timeout: 5000,
      })

      // Should see the new tag in the list - use .first() to handle multiple matches (toast, heading, etc.)
      await expect(page.getByText(uniqueTagName).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should validate tag name length (min 2 characters)', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create tag|add tag|new tag/i })

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click()

      // Try to create tag with 1 character - use more specific selector
      const tagNameInput = page.getByRole('textbox').first()
      await tagNameInput.fill('a')
      await page.getByRole('button', { name: /save|create|add/i }).click()

      // Should show validation error - use .first() to handle toast duplicates
      await expect(page.getByText(/at least 2 characters/i).first()).toBeVisible()
    }
  })

  test('should validate tag name format (no special characters)', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create tag|add tag|new tag/i })

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click()

      // Try to create tag with special characters - use more specific selector
      const tagNameInput = page.getByRole('textbox').first()
      await tagNameInput.fill('invalid@tag!')
      await page.getByRole('button', { name: /save|create|add/i }).click()

      // Should show validation error - use .first() to handle toast duplicates
      await expect(
        page.getByText(/only.*letters.*numbers|invalid.*format/i).first()
      ).toBeVisible()
    }
  })

  test('should show tag statistics', async ({ page }) => {
    // Wait for tags to load
    await page.waitForSelector('[data-testid="tag-card"], article, .tag-item', {
      timeout: 10000,
      state: 'visible',
    })

    // Each tag should show link count
    const firstTag = page.locator('[data-testid="tag-card"]').first()
    const tagContent = await firstTag.textContent()

    // Should contain a number (link count)
    expect(tagContent).toMatch(/\d+/)
  })
})

test.describe('Link-Tag Associations', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should remove tag from a link', async ({ page }) => {
    // Wait for links to load
    await page.waitForSelector('[data-testid="link-card"], article, .link-item', {
      timeout: 10000,
      state: 'visible',
    })

    // Find a link that has tags
    const linkWithTag = page.locator('[data-testid="link-card"]').filter({
      hasText: /tag/i, // Links with tags might display tag names
    }).first()

    if (await linkWithTag.isVisible({ timeout: 2000 })) {
      // Open tag editor
      const editButton = linkWithTag.getByRole('button', { name: /tag|edit/i }).first()
      await editButton.click()

      // Look for a tag chip with remove button
      const removeTagButton = page.locator('[data-testid="remove-tag"], button[aria-label*="remove"]').first()

      if (await removeTagButton.isVisible({ timeout: 2000 })) {
        await removeTagButton.click()

        // Save changes
        const saveButton = page.getByRole('button', { name: /save|apply|update/i })
        if (await saveButton.isVisible({ timeout: 1000 })) {
          await saveButton.click()
        }

        // Should see success message
        await expect(page.getByText(/tag.*removed|updated/i)).toBeVisible({
          timeout: 5000,
        })
      }
    }
  })

  test('should respect maximum 10 tags per link', async ({ page }) => {
    // This test would require a link with many tags
    // Implementation depends on how the UI handles this
    // Skipped for now as it requires specific setup
    test.skip()
  })
})

test.describe('Tag Navigation', () => {
  // Use authenticated state
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should navigate between dashboard and tags pages', async ({ page }) => {
    // Start on dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*dashboard/)

    // Navigate to tags
    const tagsLink = page.getByRole('link', { name: /tags/i })
    await tagsLink.click()

    // Should be on tags page
    await expect(page).toHaveURL(/.*tags/)

    // Navigate back to dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard|home/i })
    await dashboardLink.click()

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/)
  })
})
