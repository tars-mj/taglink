import { KeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

/**
 * Centralized keyboard shortcuts configuration for the app
 */
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  FOCUS_SEARCH: { key: '/', description: 'Focus search' } as const,
  OPEN_ADD_LINK: { key: 'n', description: 'Add new link' } as const,
  SHOW_HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' } as const,
  CLOSE_DIALOG: { key: 'Escape', description: 'Close dialog or clear search' } as const,

  // Command palette (optional)
  COMMAND_PALETTE: {
    key: 'k',
    meta: true,
    ctrl: true,
    description: 'Open command palette',
  } as const,

  // Navigation
  GO_TO_DASHBOARD: { key: 'd', meta: true, ctrl: true, description: 'Go to Dashboard' } as const,
  GO_TO_TAGS: { key: 't', meta: true, ctrl: true, description: 'Go to Tags' } as const,
  GO_TO_PROFILE: { key: 'p', meta: true, ctrl: true, description: 'Go to Profile' } as const,
  GO_TO_SETTINGS: { key: ',', meta: true, ctrl: true, description: 'Go to Settings' } as const,
} as const

export type ShortcutKey = keyof typeof KEYBOARD_SHORTCUTS

/**
 * Get all shortcuts as an array for display
 */
export function getAllShortcuts(): Array<{
  key: ShortcutKey
  shortcut: KeyboardShortcut & { description: string }
}> {
  return Object.entries(KEYBOARD_SHORTCUTS).map(([key, shortcut]) => ({
    key: key as ShortcutKey,
    shortcut,
  }))
}

/**
 * Group shortcuts by category
 */
export function getShortcutsByCategory() {
  return {
    global: [
      { name: 'FOCUS_SEARCH', ...KEYBOARD_SHORTCUTS.FOCUS_SEARCH },
      { name: 'OPEN_ADD_LINK', ...KEYBOARD_SHORTCUTS.OPEN_ADD_LINK },
      { name: 'SHOW_HELP', ...KEYBOARD_SHORTCUTS.SHOW_HELP },
      { name: 'CLOSE_DIALOG', ...KEYBOARD_SHORTCUTS.CLOSE_DIALOG },
    ],
    navigation: [
      { name: 'GO_TO_DASHBOARD', ...KEYBOARD_SHORTCUTS.GO_TO_DASHBOARD },
      { name: 'GO_TO_TAGS', ...KEYBOARD_SHORTCUTS.GO_TO_TAGS },
      { name: 'GO_TO_PROFILE', ...KEYBOARD_SHORTCUTS.GO_TO_PROFILE },
      { name: 'GO_TO_SETTINGS', ...KEYBOARD_SHORTCUTS.GO_TO_SETTINGS },
    ],
  }
}
