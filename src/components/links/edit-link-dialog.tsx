'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { StarRating } from '@/components/ui/star-rating'
import { Edit2, Loader2 } from 'lucide-react'
import { useUpdateLink } from '@/hooks/queries/use-links'
import { getUserTags, assignTagsToLink } from '@/app/actions/tags'
import { useToast } from '@/hooks/use-toast'
import type { LinkWithTags, Tag } from '@/types'

interface EditLinkDialogProps {
  link: LinkWithTags
  onSuccess?: () => void
}

export function EditLinkDialog({ link, onSuccess }: EditLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(link.title || '')
  const [description, setDescription] = useState(link.ai_description || '')
  const [rating, setRating] = useState(link.rating || null)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(true)
  const updateLinkMutation = useUpdateLink()
  const { toast } = useToast()

  // Load user's tags and set initial selection
  useEffect(() => {
    if (open) {
      loadTags()
    }
  }, [open])

  const loadTags = async () => {
    setIsLoadingTags(true)
    const result = await getUserTags()

    if (result.success && result.data) {
      setAvailableTags(result.data)

      // Set initially selected tags from link
      if (link.tags && link.tags.length > 0) {
        const linkTagIds = link.tags.map((tag) => tag.id)
        setSelectedTagIds(linkTagIds)
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      })
    }

    setIsLoadingTags(false)
  }

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      // Add tag if not at limit
      if (selectedTagIds.length < 10) {
        setSelectedTagIds([...selectedTagIds, tagId])
      } else {
        toast({
          title: 'Maximum tags reached',
          description: 'You can assign maximum 10 tags per link',
          variant: 'destructive',
        })
      }
    } else {
      // Remove tag
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate tag count - only maximum
    if (selectedTagIds.length > 10) {
      toast({
        title: 'Too many tags',
        description: 'Maximum 10 tags allowed',
        variant: 'destructive',
      })
      return
    }

    // Update link details using mutation
    updateLinkMutation.mutate(
      {
        id: link.id,
        title: title || undefined,
        ai_description: description || undefined,
        rating: rating,
      },
      {
        onSuccess: async () => {
          // Then update tag assignments
          const tagResult = await assignTagsToLink(link.id, selectedTagIds)

          if (tagResult.success) {
            setOpen(false)
            onSuccess?.()
          } else {
            toast({
              title: 'Error',
              description: tagResult.error || 'Failed to update tags',
              variant: 'destructive',
            })
          }
        },
      }
    )
  }

  const tagCountColor =
    selectedTagIds.length > 10
      ? 'text-destructive'
      : 'text-muted-foreground'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Edit link">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update your link details, tags, and rating.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Full URL Display */}
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <p className="text-sm text-black break-all bg-slate-100 rounded-md px-3 py-2 border border-slate-200">
                {link.url}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={updateLinkMutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={updateLinkMutation.isPending}
                rows={3}
                maxLength={280}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {description.length}/280 characters
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-rating">Rating</Label>
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
                showClear={true}
                readonly={updateLinkMutation.isPending}
              />
            </div>

            {/* Tags Section */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Tags (maximum 10)</Label>
                <span className={`text-sm font-medium ${tagCountColor}`}>
                  {selectedTagIds.length}/10 selected
                </span>
              </div>

              {isLoadingTags ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableTags.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No tags available. Create tags in the Tags page first.
                </div>
              ) : (
                <div className="border rounded-md p-3 max-h-[160px] overflow-y-auto">
                  <div className="space-y-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id)
                      return (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleTagToggle(tag.id, checked as boolean)
                            }
                            disabled={updateLinkMutation.isPending}
                          />
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer capitalize"
                          >
                            {tag.name}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateLinkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLinkMutation.isPending || selectedTagIds.length > 10}
            >
              {updateLinkMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
