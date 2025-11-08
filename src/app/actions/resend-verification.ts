'use server'

import { createServerActionClient } from '@/lib/supabase/server'

/**
 * Resend email verification for current user
 * Useful after changing Supabase Site URL configuration
 */
export async function resendVerificationEmail() {
  const supabase = await createServerActionClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if email is already verified
  if (user.email_confirmed_at) {
    return {
      success: false,
      error: 'Email is already verified',
    }
  }

  try {
    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })

    if (error) {
      console.error('Error resending verification email:', error)
      return {
        success: false,
        error: error.message || 'Failed to resend verification email',
      }
    }

    return {
      success: true,
      message: 'Verification email sent! Check your inbox.',
    }
  } catch (error) {
    console.error('Unexpected error resending email:', error)
    return {
      success: false,
      error: 'Failed to resend verification email',
    }
  }
}
