'use client'

import { KeyboardProvider } from './keyboard-provider'

/**
 * Client-side wrapper for KeyboardProvider
 * Used in Server Component layouts to provide keyboard shortcuts
 */
export function KeyboardWrapper({ children }: { children: React.ReactNode }) {
  return <KeyboardProvider>{children}</KeyboardProvider>
}
