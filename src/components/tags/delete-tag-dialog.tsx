'use client'

import { useTransition } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteTag } from '@/app/actions/tags'
import { toast } from '@/hooks/use-toast'

interface Tag {
  id: string
  name: string
  usage_count: number
}

interface DeleteTagDialogProps {
  tag: Tag
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteTagDialog({ tag, open, onOpenChange, onSuccess }: DeleteTagDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTag(tag.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: `Tag "${tag.name}" deleted successfully`,
        })
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete tag',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Tag</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the tag "{tag.name}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {tag.usage_count > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Warning:</p>
                <p>
                  This tag is used by {tag.usage_count} link{tag.usage_count !== 1 ? 's' : ''}.
                  Deleting it will remove the tag from all associated links.
                </p>
              </div>
            </div>
          )}

          {tag.usage_count === 0 && (
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                This tag is not used by any links and can be safely deleted.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Tag
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
