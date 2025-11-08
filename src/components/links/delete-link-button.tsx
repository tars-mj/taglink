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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { useDeleteLink } from '@/hooks/queries/use-links'

interface DeleteLinkButtonProps {
  linkId: string
  linkTitle?: string
  onSuccess?: () => void
}

export function DeleteLinkButton({ linkId, linkTitle, onSuccess }: DeleteLinkButtonProps) {
  const [open, setOpen] = useState(false)
  const deleteLinkMutation = useDeleteLink()

  const handleDelete = () => {
    deleteLinkMutation.mutate(linkId, {
      onSuccess: () => {
        setOpen(false)
        onSuccess?.()
      },
      onError: () => {
        setOpen(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" aria-label="Delete link">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Link</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this link?
            {linkTitle && (
              <span className="block mt-2 font-medium text-foreground">
                {linkTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteLinkMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLinkMutation.isPending}
          >
            {deleteLinkMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
