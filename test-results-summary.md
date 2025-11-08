# E2E Test Results Summary

**Data:** 2025-11-07
**Total Tests:** 42 (41 active + 1 skipped)
**Passed:** 11 ✅
**Failed:** 30 ❌
**Success Rate:** ~26%

---

## Main Issues Found

### 1. **Missing Polish Text Selectors**
Many tests fail because they look for English text but the app is in Polish.

**Examples:**
- Looking for button `"logout|sign out"` but Polish has `"Wyloguj"`
- Looking for heading `"Tags"` but Polish has `"Tagi"`
- Looking for placeholder `"search"` but Polish has `"Szukaj"`

**Files affected:**
- `e2e/auth.spec.ts` - logout button
- `e2e/search.spec.ts` - search input
- `e2e/tags.spec.ts` - tags heading

---

### 2. **"Strict Mode Violation" Errors**
Tests fail when selectors match multiple elements.

**Examples:**
```
Locator: locator('header, nav') resolved to 2 elements
Locator: getByRole('heading', { level: 1 }) resolved to 2 elements:
  1) <h1 class="text-2xl font-bold text-gradient">TagLink</h1>
  2) <h1 class="text-3xl font-bold">Twoje linki</h1>
```

**Solution:** Use `.first()` or more specific selectors

---

### 3. **Missing `data-testid` Attributes**
Tests look for `[data-testid="link-card"]` but components don't have these.

**Affected tests:**
- Link editing tests
- Link deletion tests
- Rating tests
- Tag management tests

**Current selectors tried:**
- `[data-testid="link-card"]` - NOT FOUND
- `article` - NOT FOUND
- `.link-item` - NOT FOUND

---

### 4. **Missing Search Input**
Dashboard doesn't have a search box.

**Error:**
```
Locator: getByPlaceholder(/search/i).or(getByRole('searchbox'))
Expected: visible
Error: element(s) not found
```

**Needed:** Add search input to dashboard

---

### 5. **Selector Ambiguity in Forms**
Tag creation form has selector conflicts.

**Error:**
```
getByLabel(/name|tag/i) resolved to 2 elements:
  1) <div role="dialog">... (the dialog itself)
  2) <input ... (the input field)
```

**Solution:** Use more specific selector like `getByRole('textbox', { name: 'Tag Name' })`

---

## Błędy posortowane według pliku

### auth.spec.ts (5/9 failed)
1. ❌ `should show login/signup options` - test clears cookies but still sees authenticated state
2. ❌ `authenticated user should access dashboard` - button `"logout|sign out"` nie istnieje (polski: "Wyloguj")
3. ❌ `authenticated user should see their email` - `locator('header, nav')` = 2 elements
4. ❌ `logout should work` - TIMEOUT (nie może znaleźć przycisku wyloguj)
5. ✅ Protected routes - 4/4 passing

### links.spec.ts (7/10 failed)
1. ❌ `should display dashboard with links` - multiple `<h1>` elements
2. ✅ `should open Add Link dialog` - PASSED
3. ❌ `should create a new link` - selector `getByText(/link (added|created|saved)/i)` = 2 elements (toast duplicates)
4. ❌ `should validate URL format` - błąd validacji nie jest widoczny
5. ❌ `should edit a link title` - brak `[data-testid="link-card"]`
6. ❌ `should rate a link` - brak `[data-testid="link-card"]`
7. ❌ `should delete a link` - brak `[data-testid="link-card"]`
8. ✅ `should display link metadata after scraping` - PASSED
9. ❌ `should open link in new tab` - brak `[data-testid="link-card"]`
10. ❌ `should display link preview on hover` - brak `[data-testid="link-card"]`

### search.spec.ts (7/10 failed)
1. ❌ `should have a search input` - search input NIE ISTNIEJE na dashboard
2. ❌ `should filter links by search term` - brak `[data-testid="link-card"]`
3. ❌ `should clear search with escape key` - TIMEOUT
4. ❌ `should show "no results" message` - TIMEOUT
5. ❌ `should focus search with "/" shortcut` - search input NIE ISTNIEJE
6. ❌ `should display tags page` - heading `"Tags"` nie istnieje (polski: "Tagi")
7. ❌ `should show tag cards with link counts` - brak `[data-testid="tag-card"]`
8. ❌ `should filter links when clicking a tag` - brak `[data-testid="tag-card"]`
9. ✅ `should search/filter tags` - PASSED
10. ✅ `should filter by rating` - PASSED

### tags.spec.ts (10/12 failed)
1. ❌ `should display tags page` - heading `"Tags"` nie istnieje (polski: "Tagi")
2. ❌ `should show existing tags` - empty state OR empty tags
3. ❌ `should create a new tag` - `getByLabel(/name|tag/i)` = 2 elements
4. ❌ `should validate tag name (min)` - `getByLabel(/name|tag/i)` = 2 elements
5. ❌ `should validate tag name (max)` - `getByLabel(/name|tag/i)` = 2 elements
6. ❌ `should validate tag format` - `getByLabel(/name|tag/i)` = 2 elements
7. ❌ `should delete a tag` - brak `[data-testid="tag-card"]`
8. ❌ `should show tag statistics` - brak `[data-testid="tag-card"]`
9. ❌ `should assign tag to a link` - brak `[data-testid="link-card"]`
10. ❌ `should remove tag from a link` - brak `[data-testid="link-card"]`
11. ⏭️ `should respect maximum 10 tags` - SKIPPED
12. ✅ `should navigate between pages` - PASSED

---

## Rekomendacje naprawy

### Prioryt 1: Dodaj `data-testid` do komponentów

**LinkCard:**
```tsx
<div data-testid="link-card">
  {/* content */}
</div>
```

**TagCard:**
```tsx
<div data-testid="tag-card">
  {/* content */}
</div>
```

### Prioryt 2: Napraw selektory polskie

Zaktualizuj testy aby obsługiwały polskie napisy:
- `"Wyloguj"` zamiast `"logout|sign out"`
- `"Tagi"` zamiast `"Tags"`
- `"Szukaj"` zamiast `"search"`

### Prioryt 3: Używaj `.first()` dla wielokrotnych elementów

```typescript
// Zamiast:
await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

// Użyj:
await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
```

### Prioryt 4: Dodaj search input do dashboard

Dashboard potrzebuje funkcji wyszukiwania.

### Prioryt 5: Popraw selektory formularzy

```typescript
// Zamiast:
await page.getByLabel(/name|tag/i).fill('test')

// Użyj:
await page.getByRole('textbox', { name: 'Tag Name' }).fill('test')
```

---

## Testy które działają ✅

1. Homepage loads
2. Protected route redirects (4 tests)
3. Open Add Link dialog
4. Link metadata after scraping
5. Search/filter tags
6. Filter by rating
7. Navigate between pages

**Total working:** 11/42 (26%)

---

## Następne kroki

1. Dodać `data-testid` do LinkCard i TagCard
2. Zaktualizować selektory na polskie teksty
3. Dodać search input do dashboard
4. Naprawić selektory formularzy (używać `.first()` lub bardziej specyficznych)
5. Uruchomić ponownie testy

**Expected improvement:** 80%+ success rate after fixes
