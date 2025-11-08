# Testing Guide for TagLink

This document provides comprehensive information about the testing infrastructure and practices for the TagLink project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Unit Tests (Vitest)](#unit-tests-vitest)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Coverage Reports](#coverage-reports)
- [CI/CD](#cicd)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

TagLink uses a comprehensive testing strategy with two main testing frameworks:

- **Vitest** - For unit and integration tests
- **Playwright** - For end-to-end (E2E) tests

## Test Structure

```
taglink/
├── src/
│   ├── __tests__/           # Unit test utilities and setup
│   │   ├── setup.ts         # Global test setup
│   │   ├── utils/           # Test utilities
│   │   └── mocks/           # Mock data and functions
│   ├── lib/
│   │   ├── utils.test.ts    # Unit tests co-located with source
│   │   └── validations/
│   │       ├── links.test.ts
│   │       └── tags.test.ts
├── e2e/                     # E2E tests directory
│   ├── .auth/               # Authentication state (gitignored)
│   ├── auth.setup.ts        # Auth setup for E2E tests
│   ├── auth.spec.ts         # Authentication flow tests
│   ├── links.spec.ts        # Link CRUD tests
│   ├── search.spec.ts       # Search & filtering tests
│   └── tags.spec.ts         # Tag management tests
├── vitest.config.ts         # Vitest configuration
├── playwright.config.ts     # Playwright configuration
└── .github/
    └── workflows/
        └── ci.yml           # CI/CD pipeline
```

## Running Tests

### Quick Start

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

### Individual Test Files

```bash
# Run specific unit test file
npm test -- src/lib/utils.test.ts

# Run specific E2E test file
npm run test:e2e -- e2e/auth.spec.ts

# Run tests matching a pattern
npm test -- --grep "validation"
```

## Unit Tests (Vitest)

### Configuration

Unit tests are configured in `vitest.config.ts` with the following features:

- **Environment**: happy-dom (faster than jsdom)
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Coverage**: v8 provider with 70% thresholds
- **Parallel**: Tests run in parallel for speed

### Writing Unit Tests

Unit tests are co-located with source files using the `.test.ts` or `.spec.ts` suffix.

Example:

```typescript
import { describe, it, expect } from 'vitest'
import { createLinkSchema } from './links'

describe('createLinkSchema', () => {
  it('should accept valid URL', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid URL', () => {
    const result = createLinkSchema.safeParse({
      url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})
```

### Test Utilities

Custom render function with React Query provider:

```typescript
import { renderWithProviders, screen, userEvent } from '@/__tests__/utils/test-utils'

test('renders component', async () => {
  renderWithProviders(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### Mocking

#### Next.js Router

Already mocked globally in `src/__tests__/setup.ts`:

```typescript
import { useRouter } from 'next/navigation'

// useRouter is automatically mocked
```

#### Server Actions

Mock server actions in individual test files:

```typescript
import { vi } from 'vitest'
import * as linkActions from '@/app/actions/links'

vi.mock('@/app/actions/links', () => ({
  createLink: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn(),
}))
```

#### API Requests with MSW

For mocking API requests, use Mock Service Worker (MSW):

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.get('/api/links', () => {
    return HttpResponse.json({ links: [] })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## E2E Tests (Playwright)

### Configuration

E2E tests are configured in `playwright.config.ts` with:

- **Base URL**: `http://localhost:3000` (configurable)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Authentication**: Shared auth state via `e2e/.auth/user.json`
- **Retry**: 2 retries on CI
- **Trace**: On first retry only

### Setup

#### 1. Create Test User

Before running E2E tests, create a test user in your Supabase project:

```bash
# Set environment variables
export E2E_TEST_EMAIL="test@example.com"
export E2E_TEST_PASSWORD="testpassword123"
```

#### 2. Run Tests

```bash
# Start dev server and run E2E tests
npm run test:e2e

# Run with UI mode (recommended for debugging)
npm run test:e2e:ui

# Run specific browser
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

### Writing E2E Tests

E2E tests use Playwright's test runner and assertions:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should do something', async ({ page }) => {
    await page.getByRole('button', { name: /add link/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
```

### Authentication in E2E Tests

Tests automatically use the saved authentication state from `e2e/auth.setup.ts`.

To test unauthenticated scenarios:

```typescript
test('unauthenticated user', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/dashboard')
  // Should redirect to login
})
```

### Debugging E2E Tests

```bash
# Debug mode (opens inspector)
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Trace viewer
npx playwright show-trace trace.zip

# Generate test code
npx playwright codegen http://localhost:3000
```

## Coverage Reports

### Generate Coverage

```bash
# Run with coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds

Current thresholds (70% for all metrics):

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

These can be adjusted in `vitest.config.ts`.

## CI/CD

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/ci.yml`) runs:

1. **Lint** - ESLint checks
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Vitest with coverage
4. **E2E Tests** - Playwright (Chromium only on CI)
5. **Build** - Next.js production build

### Required Secrets

Configure these in GitHub repository settings:

- `E2E_TEST_EMAIL` - Test user email
- `E2E_TEST_PASSWORD` - Test user password
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

### Artifacts

CI uploads these artifacts (retained for 30 days):

- Unit test coverage reports
- Playwright test reports
- Playwright traces (on failure)
- Build output (7 days)

## Best Practices

### Unit Tests

1. **Co-locate tests** - Keep test files next to source files
2. **Test behavior, not implementation** - Focus on what, not how
3. **Use descriptive test names** - `should reject invalid URL format`
4. **Arrange-Act-Assert** - Structure tests clearly
5. **Mock external dependencies** - Isolate unit under test
6. **Test edge cases** - Empty strings, null, undefined, boundaries

### E2E Tests

1. **Use accessibility selectors** - `getByRole`, `getByLabel`
2. **Wait for elements** - Use `expect.toBeVisible()` with timeout
3. **Independent tests** - Each test should work standalone
4. **Realistic user flows** - Test complete scenarios
5. **Handle async operations** - Use `waitFor*` methods
6. **Use test IDs sparingly** - Prefer semantic selectors
7. **Clean up test data** - Don't pollute production DB

### General

1. **Write tests first** (TDD when appropriate)
2. **Keep tests simple and readable**
3. **Don't test framework code** - Focus on your logic
4. **Run tests before pushing** - `npm test && npm run test:e2e`
5. **Update tests when requirements change**
6. **Review test coverage regularly**

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### E2E tests timing out

```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000  // 60 seconds
```

#### Authentication failures in E2E

1. Check E2E_TEST_EMAIL and E2E_TEST_PASSWORD
2. Verify test user exists in Supabase
3. Check Supabase URL and keys
4. Delete `e2e/.auth/user.json` and re-run setup

#### Coverage not generating

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8
```

#### Playwright browsers not installed

```bash
# Install browsers
npx playwright install --with-deps
```

### Getting Help

- Check Vitest docs: https://vitest.dev
- Check Playwright docs: https://playwright.dev
- Review test output and error messages
- Use `--debug` flag for detailed logs
- Check CI logs in GitHub Actions

## Next Steps

- [ ] Add integration tests for Server Actions
- [ ] Add visual regression tests
- [ ] Set up Playwright component testing
- [ ] Add performance testing
- [ ] Set up test data factories
- [ ] Add mutation testing
- [ ] Implement contract testing for API

## Test Statistics

As of Sprint 12:

- **Unit Tests**: 61 tests passing
  - Utils: 9 tests
  - Link Validations: 25 tests
  - Tag Validations: 27 tests
- **E2E Tests**: 40+ scenarios covered
  - Authentication: 9 tests
  - Links: 10 tests
  - Search: 6 tests
  - Tags: 15+ tests
- **Coverage**: Configured (70% thresholds)
- **CI/CD**: Fully automated with GitHub Actions

Total test execution time: ~5 seconds (unit) + ~2 minutes (E2E)
