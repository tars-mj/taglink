'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTag } from '@/app/actions/tags'
import { toast } from '@/hooks/use-toast'

interface CreateTagDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTagDialog({ children, open, onOpenChange, onSuccess }: CreateTagDialogProps) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Tag name is required',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await createTag(name.trim())

      if (result.success) {
        toast({
          title: 'Success',
          description: `Tag "${name}" created successfully`,
        })
        setName('')
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create tag',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
          <DialogDescription>
            Add a new tag to organize your links. Tags must be 2-30 characters and can contain
            letters, numbers, spaces, and hyphens.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tag Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. javascript, web-dev, tutorial"
              disabled={isPending}
              maxLength={30}
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
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tag
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
