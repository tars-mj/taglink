'use client'

import { useState, useMemo } from 'react'
import { Tag, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagList } from '@/components/tags/tag-list'
import { CreateTagDialog } from '@/components/tags/create-tag-dialog'
import { TagCardSkeletonGrid, TagStatsSkeleton } from '@/components/skeletons/tag-card-skeleton'
import { useTags } from '@/hooks/queries/use-tags'

export default function TagsPage() {
  const { data: tags = [], isLoading, refetch } = useTags()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Filter tags based on search query (client-side filtering)
  const filteredTags = useMemo(() => {
    if (searchQuery.trim() === '') {
      return tags
    }
    const query = searchQuery.toLowerCase()
    return tags.filter((tag: any) =>
      tag.name.toLowerCase().includes(query)
    )
  }, [searchQuery, tags])

  const handleTagsUpdate = () => {
    refetch()
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-main text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Tag Management</h1>
          </div>
          <div className="min-h-[1.5rem]">
            <p className="text-white/90">
              Organize and manage your tags to keep your links well-categorized
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Create Tag Button */}
          <CreateTagDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={handleTagsUpdate}
          >
            <Button className="bg-gradient-main hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </CreateTagDialog>
        </div>

        {/* Statistics */}
        {isLoading ? (
          <TagStatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Tags</p>
              <p className="text-2xl font-bold">{tags.length}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1">Most Used</p>
              <p className="text-2xl font-bold">
                {tags.length > 0
                  ? tags.reduce((max, tag) => tag.usage_count > max ? tag.usage_count : max, 0)
                  : 0
                }
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1">Unused Tags</p>
              <p className="text-2xl font-bold">
                {tags.filter(tag => tag.usage_count === 0).length}
              </p>
            </div>
          </div>
        )}

        {/* Tags List */}
        {isLoading ? (
          <TagCardSkeletonGrid count={9} />
        ) : filteredTags.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No tags found' : 'No tags yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first tag to start organizing your links'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-main hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tag
              </Button>
            )}
          </div>
        ) : (
          <TagList tags={filteredTags} onUpdate={handleTagsUpdate} />
        )}
      </div>
    </>
  )
}
