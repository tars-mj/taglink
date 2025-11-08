'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateLink } from '@/hooks/queries/use-links'
import { RateLimitIndicator, refreshRateLimit } from '@/components/rate-limit/rate-limit-indicator'

interface AddLinkDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddLinkDialog({ open: externalOpen, onOpenChange }: AddLinkDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const createLinkMutation = useCreateLink()

  // Use external state if provided, otherwise use internal
  const open = externalOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('url', url)
    if (title) formData.append('title', title)

    createLinkMutation.mutate(formData, {
      onSuccess: (result) => {
        const linkTitle = result.data?.title || url
        setUrl('')
        setTitle('')
        setOpen(false)
        // Refresh rate limit indicator
        refreshRateLimit()
      },
      onError: () => {
        // Refresh rate limit indicator even on error (in case of rate limit violation)
        refreshRateLimit()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[525px] min-h-[400px] animate-scale-in">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>
              Paste a URL to save it. We'll fetch metadata, generate AI description, and suggest tags automatically (5-15 seconds).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Rate Limit Indicator */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <RateLimitIndicator variant="detailed" showDetails />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={createLinkMutation.isPending}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Will be auto-filled from page title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={createLinkMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                {title ? 'Auto-filled from page. Edit if needed.' : 'Will be fetched from page automatically'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createLinkMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLinkMutation.isPending || !url}>
              {createLinkMutation.isPending ? 'Processing with AI...' : 'Add Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
