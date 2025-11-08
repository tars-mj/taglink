import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  console.log('[Auth Callback] Processing callback request')
  console.log('[Auth Callback] Code present:', !!code)
  console.log('[Auth Callback] Next URL:', next)

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    console.log('[Auth Callback] Exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error exchanging code:', error.message)
      return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
    }

    console.log('[Auth Callback] Successfully exchanged code, redirecting to:', next)
    // Redirect to dashboard after successful email confirmation
    return NextResponse.redirect(new URL(next, request.url))
  }

  console.error('[Auth Callback] No code provided in callback')
  // Return the user to login with error
  return NextResponse.redirect(new URL('/login?error=no_code', request.url))
}