# ADR 001: Sprint 1 - Authentication & Dashboard Implementation

**Status:** Implemented
**Date:** 2025-11-03
**Decision Makers:** Development Team

## Context

TagLink MVP requires a solid foundation with user authentication and basic dashboard functionality. This is Sprint 1 of the full implementation based on PRD (.ai/prd.md), tech stack (.ai/tech-stack.md), and database plan (.ai/db-plan.md).

## Decision

Implemented the following core infrastructure and features:

### 1. Project Initialization
- Next.js 15.0.3 with App Router
- TypeScript 5 with strict mode
- Tailwind CSS with custom gradient theme
- React 18.3.1 (resolved version conflict with Next.js 15)

### 2. Dependencies Installed
- **Supabase:** `@supabase/supabase-js`, `@supabase/ssr`
- **UI Components:** shadcn/ui, Radix UI primitives
- **Forms:** React Hook Form, Zod validation
- **Icons:** Lucide React
- **Future:** Playwright, OpenAI (prepared but not yet used)

### 3. Environment Configuration
Created `.env.local` and `.env.example` with:
- Supabase project URL and anon key
- OpenRouter API key placeholder
- AI processing configuration

### 4. Database Types
Generated TypeScript types from Supabase schema:
- `src/types/database.types.ts` - Database schema types
- `src/types/index.ts` - Application-level types (LinkWithTags, TagWithCount)

### 5. Supabase Client Setup
Created two client patterns:
- `src/lib/supabase/client.ts` - Browser client for client components
- `src/lib/supabase/server.ts` - Server clients for Server Components and Server Actions
- Cookie-based session management

### 6. Authentication Middleware
`src/middleware.ts`:
- Protects routes: `/dashboard`, `/links`, `/tags`
- Redirects unauthenticated users to `/login`
- Redirects authenticated users from auth pages to `/dashboard`
- Cookie-based session handling

### 7. Authentication Pages
**Registration** (`src/app/(auth)/register/page.tsx`):
- Email/password form with validation
- Password confirmation matching
- Email confirmation flow
- Success toast notification
- Redirects to `/auth/callback` after email verification

**Login** (`src/app/(auth)/login/page.tsx`):
- Email/password form
- Error handling for invalid credentials
- Auto-redirect to dashboard on success

**Callback Handler** (`src/app/auth/callback/route.ts`):
- Exchanges email verification code for session
- Redirects to `/dashboard` on success
- Error handling with redirect to `/login`

### 8. Dashboard Layout
`src/app/dashboard/layout.tsx`:
- Protected layout checking authentication
- Server Component pattern
- Includes DashboardHeader

`src/components/layout/dashboard-header.tsx`:
- Search bar (UI only, logic pending)
- "Add Link" button (gradient styled, logic pending)
- User email display
- Logout functionality

### 9. Dashboard Page
`src/app/dashboard/page.tsx`:
- Fetches user's links with tags using Supabase joins
- LinkCard component displaying:
  - Title with external link icon
  - Domain
  - AI-generated description
  - Tags as badges
  - 5-star rating display
  - AI processing status
- EmptyState component for new users
- Grid layout responsive (1/2/3 columns)

### 10. Custom Gradient Theme
`tailwind.config.ts` and `src/app/globals.css`:
- Purple-blue-pink gradient matching UI screenshot
- Custom utility classes:
  - `.bg-gradient-main`
  - `.text-gradient`
  - Gradient button styles
- Custom scrollbar styling
- Shimmer animation for loading states

### 11. Toast Notifications
- Integrated Toaster component in root layout
- Fixed import path issue (`@/hooks/use-toast`)
- Used for auth feedback

## Consequences

### Positive
✅ Solid authentication foundation with Supabase
✅ Type-safe database queries with generated types
✅ Middleware-based route protection
✅ Server Components for optimal performance
✅ Custom gradient theme matching design
✅ Responsive dashboard layout
✅ Email verification flow working end-to-end
✅ All build errors resolved
✅ Dev server running successfully

### Pending Implementation
⏳ "Add Link" functionality (form + logic)
⏳ Web scraping with Playwright
⏳ OpenRouter.ai integration for AI features
⏳ Tag management system
⏳ Real-time search with debounce
⏳ Filtering by tags (AND logic)
⏳ Sorting (rating, date, relevance)
⏳ Rate limiting (30 links/hour)
⏳ Database migrations deployment to Supabase Cloud
⏳ Connect to actual Supabase project

### Technical Debt
- Search functionality is UI-only (TODO comment in dashboard-header.tsx:37)
- Need to connect to actual Supabase Cloud project
- OpenRouter API key not yet configured
- No error boundaries yet
- No loading states yet
- No unit/E2E tests yet

## Errors Encountered and Resolved

1. **React Version Conflict**
   - Issue: Next.js 15.0.3 required different React RC version
   - Fix: Changed to React 18.3.1

2. **Docker Not Running**
   - Issue: Cannot connect to Docker daemon for local Supabase
   - Fix: Prepared for Supabase Cloud instead

3. **Missing Radix UI Dependencies**
   - Issue: Module not found errors for @radix-ui packages
   - Fix: Installed missing packages

4. **Wrong Import Path**
   - Issue: toaster.tsx importing from wrong path
   - Fix: Changed to `@/hooks/use-toast`

5. **404 on Email Verification**
   - Issue: Missing `/auth/callback` route handler
   - Fix: Created route handler with session exchange logic

## Files Changed

### Created Files
- `.env.local`, `.env.example`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/middleware.ts`
- `src/types/database.types.ts`
- `src/types/index.ts`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/layout/dashboard-header.tsx`
- `src/components/ui/[multiple shadcn components]`
- `src/hooks/use-toast.ts`

### Modified Files
- `package.json` - Dependencies and scripts
- `tailwind.config.ts` - Custom gradient theme
- `src/app/globals.css` - Custom styles
- `src/app/layout.tsx` - Added Toaster
- `tsconfig.json` - Path aliases

## Alternatives Considered

1. **Auth0 vs Supabase Auth**
   - Decision: Supabase Auth
   - Reason: Integrated with database, simpler setup, lower cost

2. **Pages Router vs App Router**
   - Decision: App Router
   - Reason: Better performance with Server Components, future-proof

3. **Client-side vs Server-side Auth Check**
   - Decision: Middleware + Server Components
   - Reason: Better security, no flash of unauthorized content

4. **Local Supabase vs Cloud**
   - Decision: Cloud (after Docker issue)
   - Reason: Simpler deployment path, no local Docker requirement

## Notes

This implementation follows the architecture defined in:
- PRD: `.ai/prd.md` (720 lines)
- Tech Stack: `.ai/tech-stack.md`
- Database Plan: `.ai/db-plan.md`

The purple-blue gradient theme was designed based on the provided UI screenshot.

## Next Steps

Sprint 2 should focus on:
1. Implement "Add Link" form with validation
2. Integrate Playwright for web scraping
3. Connect OpenRouter.ai for AI descriptions and tag suggestions
4. Deploy Supabase migrations
5. Test complete flow end-to-end

---

**Related ADRs:** None (this is the first ADR)
**References:**
- [PRD](.ai/prd.md)
- [Tech Stack](.ai/tech-stack.md)
- [Database Plan](.ai/db-plan.md)
