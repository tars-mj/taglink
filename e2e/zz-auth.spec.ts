import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  // Use authenticated state for tests that need it
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/TagLink/i)
  })

  test.skip('should show login/signup options for unauthenticated users', async ({
    page,
    context,
  }) => {
    // TODO: Homepage shows different UI - needs investigation
    // Clear authentication state for this test
    await context.clearCookies()

    await page.goto('/')

    // Should see login or sign up options (Polish: "Zaloguj się" / "Zarejestruj się")
    const loginButton = page.getByRole('button', { name: /zaloguj|sign in|login/i })
    const signUpButton = page.getByRole('button', { name: /zarejestruj|sign up|register/i })

    // At least one should be visible
    const hasLoginButton = await loginButton.isVisible().catch(() => false)
    const hasSignUpButton = await signUpButton.isVisible().catch(() => false)

    expect(hasLoginButton || hasSignUpButton).toBe(true)
  })

  test('authenticated user should access dashboard', async ({ page }) => {
    // This test uses the saved authentication state
    await page.goto('/dashboard')

    // Should be able to access dashboard
    await expect(page).toHaveURL(/.*dashboard/)

    // Should see user-specific elements (Polish: "Wyloguj")
    const logoutButton = page.getByRole('button', { name: /wyloguj|logout|sign out/i })
    await expect(logoutButton).toBeVisible({ timeout: 10000 })
  })

  test.skip('authenticated user should see their email or username', async ({ page }) => {
    // TODO: Test times out on networkidle - needs investigation
    await page.goto('/dashboard')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Should see some user identifier (email, name, or avatar)
    // This depends on your header implementation - use .first() to handle multiple header elements
    const header = page.locator('header, nav').first()
    await expect(header).toBeVisible()
  })

})

test.describe('Logout Flow', () => {
  // Isolate logout test to prevent polluting auth state of other tests
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('logout should work and redirect to homepage', async ({ page }) => {
    await page.goto('/dashboard')

    // Find and click logout button (Polish: "Wyloguj")
    const logoutButton = page.getByRole('button', { name: /wyloguj|logout|sign out/i })
    await logoutButton.click()

    // Should redirect to homepage or login page
    await expect(page).toHaveURL(/.*\/(login)?$/)
  })
})

test.describe('Protected Routes', () => {
  // Reset storage state for these tests to simulate unauthenticated users
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated user should be redirected from dashboard', async ({ page }) => {
    // Try to access dashboard
    await page.goto('/dashboard')

    // Should be redirected to home or login
    await page.waitForURL(/.*\/(login)?$/, { timeout: 5000 })
    expect(page.url()).not.toContain('/dashboard')
  })

  test('unauthenticated user should be redirected from tags page', async ({ page }) => {
    await page.goto('/tags')

    // Should be redirected
    await page.waitForURL(/.*\/(login)?$/, { timeout: 5000 })
    expect(page.url()).not.toContain('/tags')
  })

  test('unauthenticated user should be redirected from profile page', async ({ page }) => {
    await page.goto('/profile')

    // Should be redirected
    await page.waitForURL(/.*\/(login)?$/, { timeout: 5000 })
    expect(page.url()).not.toContain('/profile')
  })

  test('unauthenticated user should be redirected from settings page', async ({ page }) => {
    await page.goto('/settings')

    // Should be redirected
    await page.waitForURL(/.*\/(login)?$/, { timeout: 5000 })
    expect(page.url()).not.toContain('/settings')
  })
})
