'use client'

import { useState, useTransition, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { renameTag } from '@/app/actions/tags'
import { toast } from '@/hooks/use-toast'

interface Tag {
  id: string
  name: string
  usage_count: number
}

interface RenameTagDialogProps {
  tag: Tag
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RenameTagDialog({ tag, open, onOpenChange, onSuccess }: RenameTagDialogProps) {
  const [name, setName] = useState(tag.name)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setName(tag.name)
    }
  }, [open, tag.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || name.trim() === tag.name) {
      toast({
        title: 'Validation error',
        description: 'Please enter a different name',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await renameTag(tag.id, name.trim())

      if (result.success) {
        toast({
          title: 'Success',
          description: `Tag renamed from "${tag.name}" to "${name}"`,
        })
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to rename tag',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Tag</DialogTitle>
          <DialogDescription>
            Change the name of "{tag.name}". This will update all {tag.usage_count} link
            {tag.usage_count !== 1 ? 's' : ''} using this tag.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">New Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new tag name"
              disabled={isPending}
              maxLength={30}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/30 characters
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || name.trim() === tag.name}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rename Tag
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
