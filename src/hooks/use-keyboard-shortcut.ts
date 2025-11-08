'use client'

import { useEffect, useCallback, useRef } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean // Command on Mac
  shift?: boolean
  alt?: boolean
}

export type KeyboardShortcutHandler = (event: KeyboardEvent) => void

/**
 * Hook for registering keyboard shortcuts
 * @param shortcut - The keyboard shortcut configuration
 * @param handler - Function to call when shortcut is pressed
 * @param options - Additional options
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut | KeyboardShortcut[],
  handler: KeyboardShortcutHandler,
  options: {
    enabled?: boolean
    preventDefault?: boolean
    ignoreInputs?: boolean // Ignore when focused on input/textarea
  } = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = true,
  } = options

  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut]

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      try {
        if (!enabled) return

        // Ignore if focused on input elements (unless explicitly disabled)
        if (ignoreInputs) {
          const target = event.target as HTMLElement
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            return
          }
        }

        // Check if any shortcut matches
        const matched = shortcuts.some((sc) => {
          // Guard against invalid shortcuts
          if (!sc || typeof sc !== 'object' || !sc.key) return false

          const keyMatches = event.key.toLowerCase() === sc.key.toLowerCase()
          if (!keyMatches) return false

          // Exact modifier matching:
          // - If sc.ctrl is true, event.ctrlKey must be true
          // - If sc.ctrl is false/undefined, event.ctrlKey must be false
          const ctrlMatches = sc.ctrl === true ? event.ctrlKey : !event.ctrlKey
          const metaMatches = sc.meta === true ? event.metaKey : !event.metaKey
          const shiftMatches = sc.shift === true ? event.shiftKey : !event.shiftKey
          const altMatches = sc.alt === true ? event.altKey : !event.altKey

          return ctrlMatches && metaMatches && shiftMatches && altMatches
        })

        if (matched) {
          if (preventDefault) {
            event.preventDefault()
          }
          handlerRef.current(event)
        }
      } catch (error) {
        // Silently catch errors to prevent keyboard shortcuts from breaking the app
        console.warn('Keyboard shortcut error:', error)
      }
    },
    [enabled, preventDefault, ignoreInputs, shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook for detecting if user is on Mac
 */
export function useIsMac() {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut, isMac = false): string {
  const parts: string[] = []

  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl')
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Cmd')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')

  // Format key name
  const keyName = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1)

  parts.push(keyName)

  return parts.join(isMac ? '' : '+')
}
