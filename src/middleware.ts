import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for static assets and health checks
  const pathname = request.nextUrl.pathname
  if (pathname.includes('.') || pathname === '/api/health') {
    return NextResponse.next()
  }

  // Check if Supabase env vars are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables in middleware')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  let user = null
  try {
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), 5000)
    )

    const authPromise = supabase.auth.getUser()

    const result = await Promise.race([authPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getUser>>

    if (result.error) {
      // Only log errors for non-auth routes to reduce noise
      if (!request.nextUrl.pathname.startsWith('/login') &&
          !request.nextUrl.pathname.startsWith('/register') &&
          !request.nextUrl.pathname.startsWith('/')) {
        console.error('Supabase auth error in middleware:', result.error.message)
      }
    }
    user = result.data?.user || null
  } catch (error) {
    // Only log for protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/links') ||
        request.nextUrl.pathname.startsWith('/tags')) {
      console.error('Failed to get user in middleware:', error instanceof Error ? error.message : 'Unknown error')
    }
    // Continue without user - protected routes will redirect to login
  }

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/links') ||
      request.nextUrl.pathname.startsWith('/tags') ||
      request.nextUrl.pathname.startsWith('/profile') ||
      request.nextUrl.pathname.startsWith('/settings')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Auth routes - redirect if already logged in
  if (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (email verification callback)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}