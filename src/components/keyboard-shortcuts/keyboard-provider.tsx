'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { KEYBOARD_SHORTCUTS } from '@/lib/utils/keyboard-shortcuts'

interface KeyboardProviderProps {
  children: React.ReactNode
  onOpenAddLink?: () => void
  onFocusSearch?: () => void
}

/**
 * Global keyboard shortcuts provider
 * Handles all app-wide keyboard shortcuts
 */
export function KeyboardProvider({
  children,
  onOpenAddLink,
  onFocusSearch
}: KeyboardProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Focus search (/)
  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.FOCUS_SEARCH,
    useCallback(() => {
      if (onFocusSearch) {
        onFocusSearch()
      } else {
        // Fallback: try to focus any search input
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        searchInput?.focus()
      }
    }, [onFocusSearch])
  )

  // Open add link dialog (n)
  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.OPEN_ADD_LINK,
    useCallback(() => {
      if (onOpenAddLink) {
        onOpenAddLink()
      } else {
        // Fallback: dispatch custom event that AddLinkDialog can listen to
        window.dispatchEvent(new CustomEvent('keyboard-add-link'))
      }
    }, [onOpenAddLink])
  )

  // Close dialog (Escape)
  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.CLOSE_DIALOG,
    useCallback(() => {
      // Dispatch custom event for dialogs to listen to
      window.dispatchEvent(new CustomEvent('keyboard-close-dialog'))

      // Clear search if on dashboard
      if (pathname === '/dashboard') {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (searchInput && searchInput.value) {
          searchInput.value = ''
          searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
    }, [pathname])
  )

  // Navigation shortcuts
  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.GO_TO_DASHBOARD,
    useCallback(() => {
      router.push('/dashboard')
    }, [router])
  )

  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.GO_TO_TAGS,
    useCallback(() => {
      router.push('/tags')
    }, [router])
  )

  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.GO_TO_PROFILE,
    useCallback(() => {
      router.push('/profile')
    }, [router])
  )

  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.GO_TO_SETTINGS,
    useCallback(() => {
      router.push('/settings')
    }, [router])
  )

  return (
    <>
      {children}
    </>
  )
}
