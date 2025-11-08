'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'
import { getShortcutsByCategory } from '@/lib/utils/keyboard-shortcuts'
import { formatShortcut, useIsMac } from '@/hooks/use-keyboard-shortcut'
import { Badge } from '@/components/ui/badge'

interface ShortcutsHelpDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShortcutsHelpDialog({ open: controlledOpen, onOpenChange }: ShortcutsHelpDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isMac = useIsMac()
  const shortcuts = getShortcutsByCategory()

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Skróty klawiszowe">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with TagLink faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Global Shortcuts */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Global Shortcuts
            </h3>
            <div className="space-y-1 bg-slate-100 rounded-md p-3">
              {shortcuts.global.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.key}
                  description={shortcut.description}
                  shortcut={formatShortcut(shortcut, isMac)}
                />
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Navigation
            </h3>
            <div className="space-y-1 bg-slate-100 rounded-md p-3">
              {shortcuts.navigation.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.key}
                  description={shortcut.description}
                  shortcut={formatShortcut(shortcut, isMac)}
                />
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 border border-blue-200/60">
            <p className="text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">💡 Tip:</span> Most shortcuts work globally, but some require focus on
              specific elements. Press <Badge variant="outline" className="font-mono text-xs mx-1 bg-white">?</Badge> anytime to see this help dialog.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutRow({ description, shortcut }: { description: string; shortcut: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded hover:bg-slate-200 transition-colors">
      <span className="text-sm text-black">{description}</span>
      <kbd className="inline-flex items-center gap-1 rounded-md border-2 border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-800 shadow-sm">
        {shortcut}
      </kbd>
    </div>
  )
}
