'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, GitMerge, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { RenameTagDialog } from '@/components/tags/rename-tag-dialog'
import { MergeTagDialog } from '@/components/tags/merge-tag-dialog'
import { DeleteTagDialog } from '@/components/tags/delete-tag-dialog'

interface TagWithUsage {
  id: string
  name: string
  created_at: string
  usage_count: number
}

interface TagListProps {
  tags: TagWithUsage[]
  onUpdate: () => void
}

export function TagList({ tags, onUpdate }: TagListProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<TagWithUsage | null>(null)

  const handleRename = (tag: TagWithUsage) => {
    setSelectedTag(tag)
    setRenameDialogOpen(true)
  }

  const handleMerge = (tag: TagWithUsage) => {
    setSelectedTag(tag)
    setMergeDialogOpen(true)
  }

  const handleDelete = (tag: TagWithUsage) => {
    setSelectedTag(tag)
    setDeleteDialogOpen(true)
  }

  const handleSuccess = () => {
    setRenameDialogOpen(false)
    setMergeDialogOpen(false)
    setDeleteDialogOpen(false)
    setSelectedTag(null)
    onUpdate()
  }

  // Sort by usage count descending
  const sortedTags = [...tags].sort((a, b) => b.usage_count - a.usage_count)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTags.map((tag) => (
          <div
            key={tag.id}
            data-testid="tag-card"
            className="bg-white rounded-lg border p-4 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate capitalize">{tag.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <LinkIcon className="h-3 w-3" />
                  <span>
                    {tag.usage_count} {tag.usage_count === 1 ? 'link' : 'links'}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Tag options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRename(tag)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMerge(tag)}>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(tag)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Badge variant={tag.usage_count === 0 ? 'secondary' : 'default'} className="capitalize">
              {tag.usage_count === 0 ? 'Unused' : 'Active'}
            </Badge>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      {selectedTag && (
        <>
          <RenameTagDialog
            tag={selectedTag}
            open={renameDialogOpen}
            onOpenChange={setRenameDialogOpen}
            onSuccess={handleSuccess}
          />
          <MergeTagDialog
            tag={selectedTag}
            allTags={tags.filter((t) => t.id !== selectedTag.id)}
            open={mergeDialogOpen}
            onOpenChange={setMergeDialogOpen}
            onSuccess={handleSuccess}
          />
          <DeleteTagDialog
            tag={selectedTag}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  )
}
