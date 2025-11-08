'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Filter, X, Check } from 'lucide-react'
import { getTagsForFilter } from '@/app/actions/search'

interface SearchFiltersProps {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  onClearFilters: () => void
}

interface Tag {
  id: string
  name: string
  count: number
}

export function SearchFilters({
  selectedTagIds,
  onTagsChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    setIsLoading(true)
    const result = await getTagsForFilter()
    if (result.success && result.data) {
      setTags(result.data)
    }
    setIsLoading(false)
  }

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTagIds, tagId])
    }
  }

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))
  const hasActiveFilters = selectedTagIds.length > 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tag Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={hasActiveFilters ? 'border-blue-500 bg-blue-50' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Tagi
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                {selectedTagIds.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Filtruj po tagach</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500">Ładowanie tagów...</div>
          ) : tags.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">Brak dostępnych tagów</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {tags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => toggleTag(tag.id)}
                  className="cursor-pointer"
                >
                  <span className="flex-1">{tag.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({tag.count})</span>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Tag Badges */}
      {selectedTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
        >
          <span>{tag.name}</span>
          <button
            onClick={() => toggleTag(tag.id)}
            className="rounded-full hover:bg-gray-300 p-0.5"
            aria-label={`Remove ${tag.name} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="h-4 w-4 mr-1" />
          Wyczyść filtry
        </Button>
      )}
    </div>
  )
}
