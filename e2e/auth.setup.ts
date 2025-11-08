import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

/**
 * Setup authentication for E2E tests
 * This runs before all tests and saves the authenticated state
 *
 * Note: For actual testing, you'll need to:
 * 1. Set up a test Supabase project or use Supabase local development
 * 2. Create a test user account
 * 3. Update credentials below or use environment variables
 */
setup('authenticate', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/')

  // Check if already authenticated (redirected to dashboard)
  const url = page.url()
  if (url.includes('/dashboard')) {
    console.log('Already authenticated, saving state...')
    await page.context().storageState({ path: authFile })
    return
  }

  // If not authenticated, perform login
  try {
    // Try to click the login link to navigate to login page (Polish: "Zaloguj się")
    const loginLink = page.getByRole('link', { name: /zaloguj|sign in|login/i })
    if (await loginLink.isVisible({ timeout: 2000 })) {
      await loginLink.click()
      await page.waitForURL('**/login', { timeout: 5000 })
    } else {
      // If no login link, navigate directly to login page
      await page.goto('/login')
    }

    // Wait for login page to load
    await page.waitForLoadState('networkidle')

    // Fill in login credentials
    const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com'
    const testPassword = process.env.E2E_TEST_PASSWORD || 'testpassword123'

    console.log('Attempting to login...')

    // Fill in the form (support both Polish and English labels)
    await page.getByLabel(/email|e-mail/i).fill(testEmail)
    await page.getByLabel(/password|hasło/i).fill(testPassword)

    // Submit the login form (Polish: "Zaloguj się" or English: "Sign in")
    await page.getByRole('button', { name: /zaloguj|sign in|login/i }).click()

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Verify we're authenticated
    await expect(page).toHaveURL(/.*dashboard/)

    // Wait a bit for Supabase to finish setting up the session in storage
    await page.waitForTimeout(2000)

    // Save signed-in state (includes cookies and localStorage)
    await page.context().storageState({ path: authFile })

    console.log('✅ Authentication successful, state saved to:', authFile)

    // Log what was saved for debugging
    const savedState = await page.context().storageState()
    console.log('📦 Cookies saved:', savedState.cookies.length)
    console.log('📦 Origins with localStorage saved:', savedState.origins?.length || 0)
  } catch (error) {
    console.error('❌ Authentication failed:', error)
    console.log('Current URL:', page.url())
    console.log('\n⚠️  Setup Instructions:')
    console.log('1. Create a test user account in your Supabase project')
    console.log('2. Set environment variables:')
    console.log('   export E2E_TEST_EMAIL="your-test-email@example.com"')
    console.log('   export E2E_TEST_PASSWORD="your-test-password"')
    console.log('3. Make sure the dev server is running: npm run dev')

    // Save empty state so tests can continue (they will fail appropriately)
    await page.context().storageState({ path: authFile })
  }
})
