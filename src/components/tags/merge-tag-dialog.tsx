'use client'

import { useState, useTransition } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mergeTags } from '@/app/actions/tags'
import { toast } from '@/hooks/use-toast'

interface Tag {
  id: string
  name: string
  usage_count: number
}

interface MergeTagDialogProps {
  tag: Tag
  allTags: Tag[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function MergeTagDialog({ tag, allTags, open, onOpenChange, onSuccess }: MergeTagDialogProps) {
  const [targetTagId, setTargetTagId] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetTagId) {
      toast({
        title: 'Validation error',
        description: 'Please select a target tag',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await mergeTags(tag.id, targetTagId)
      const targetTag = allTags.find(t => t.id === targetTagId)

      if (result.success) {
        toast({
          title: 'Success',
          description: `Tag "${tag.name}" merged into "${targetTag?.name}". All links updated.`,
        })
        setTargetTagId('')
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to merge tags',
          variant: 'destructive',
        })
      }
    })
  }

  const selectedTargetTag = allTags.find(t => t.id === targetTagId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Tag</DialogTitle>
          <DialogDescription>
            Merge "{tag.name}" into another tag. All {tag.usage_count} link{tag.usage_count !== 1 ? 's' : ''} will be updated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Source Tag (will be deleted)</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium capitalize">{tag.name}</p>
              <p className="text-sm text-muted-foreground">
                {tag.usage_count} link{tag.usage_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-tag">Target Tag (will keep)</Label>
            <Select value={targetTagId} onValueChange={setTargetTagId} disabled={isPending}>
              <SelectTrigger id="target-tag">
                <SelectValue placeholder="Select target tag..." />
              </SelectTrigger>
              <SelectContent>
                {allTags.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No other tags available
                  </SelectItem>
                ) : (
                  allTags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="capitalize">{t.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({t.usage_count} {t.usage_count === 1 ? 'link' : 'links'})
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTargetTag && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Preview:</p>
                <p>
                  After merging, all links tagged with "{tag.name}" will have "{selectedTargetTag.name}" instead.
                  The "{tag.name}" tag will be permanently deleted.
                </p>
              </div>
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
              type="submit"
              variant="destructive"
              disabled={isPending || !targetTagId || allTags.length === 0}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Merge Tags
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
