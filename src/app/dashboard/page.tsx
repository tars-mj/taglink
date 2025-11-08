'use client'

import { useState, useCallback, useTransition, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ExternalLink, Search } from 'lucide-react'
import { EditLinkDialog } from '@/components/links/edit-link-dialog'
import { DeleteLinkButton } from '@/components/links/delete-link-button'
import { SearchFilters } from '@/components/search/search-filters'
import { SortSelector } from '@/components/search/sort-selector'
import { Pagination } from '@/components/search/pagination'
import { LinkStatisticsPanel } from '@/components/statistics/link-statistics'
import { type SortOption } from '@/app/actions/search'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/star-rating'
import { updateLink } from '@/app/actions/links'
import { useToast } from '@/hooks/use-toast'
import { LinkCardSkeletonGrid } from '@/components/skeletons/link-card-skeleton'
import type { DefaultView } from '@/types'
import { useLinks } from '@/hooks/queries/use-links'
import { useUserPreferences } from '@/hooks/queries/use-user'
import { EmptyState } from '@/components/dashboard/empty-state'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get params from URL (memoized to prevent infinite loops)
  const query = searchParams.get('q') || ''
  const selectedTagIds = useMemo(
    () => searchParams.get('tags')?.split(',').filter(Boolean) || [],
    [searchParams]
  )
  const sortBy = (searchParams.get('sort') || 'rating') as SortOption
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Local search state for input (debounced)
  const [searchInput, setSearchInput] = useState(query)

  // Fetch user preferences with React Query
  const { data: preferences } = useUserPreferences()
  const viewMode = preferences?.default_view || 'grid'
  const pageSize = preferences?.links_per_page || 12

  // Fetch links with React Query (auto-caches based on params)
  const { data: searchResult, isLoading, refetch } = useLinks({
    query,
    tagIds: selectedTagIds,
    sortBy,
    page,
    pageSize,
  })

  // Update URL params
  const updateUrlParams = useCallback(
    (updates: {
      q?: string
      tags?: string[]
      sort?: SortOption
      page?: number
    }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.q !== undefined) {
        if (updates.q) {
          params.set('q', updates.q)
        } else {
          params.delete('q')
        }
      }

      if (updates.tags !== undefined) {
        if (updates.tags.length > 0) {
          params.set('tags', updates.tags.join(','))
        } else {
          params.delete('tags')
        }
      }

      if (updates.sort !== undefined) {
        params.set('sort', updates.sort)
      }

      if (updates.page !== undefined) {
        params.set('page', updates.page.toString())
      }

      router.push(`/dashboard?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Sync search input with URL query param
  useEffect(() => {
    setSearchInput(query)
  }, [query])

  // Debounce search input (600ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== query) {
        updateUrlParams({ q: searchInput, page: 1 })
      }
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [searchInput, query, updateUrlParams])

  // Handlers
  const handleTagsChange = (tagIds: string[]) => {
    updateUrlParams({ tags: tagIds, page: 1 })
  }

  const handleSortChange = (newSort: SortOption) => {
    updateUrlParams({ sort: newSort, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    updateUrlParams({ q: '', tags: [], page: 1 })
  }

  const hasLinks = searchResult && searchResult.links.length > 0
  const hasActiveFilters = selectedTagIds.length > 0

  // Handler to trigger Add Link dialog from empty state
  const handleOpenAddLinkDialog = () => {
    window.dispatchEvent(new Event('keyboard-add-link'))
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-main text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <ExternalLink className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Twoje linki</h1>
          </div>
          <div className="min-h-[1.5rem]">
            {isLoading ? (
              <Skeleton className="h-5 w-48 bg-white/20" />
            ) : (
              <p className="text-white/90">
                {searchResult ? (
                (query || hasActiveFilters) ? (
                  <>
                    Znaleziono {searchResult.totalCount}{' '}
                    {searchResult.totalCount === 1
                      ? 'link'
                      : searchResult.totalCount < 5
                      ? 'linki'
                      : 'linków'}
                  </>
                ) : (
                  <>
                    Masz {searchResult.totalCount}{' '}
                    {searchResult.totalCount === 1
                      ? 'zapisany link'
                      : searchResult.totalCount < 5
                      ? 'zapisane linki'
                      : 'zapisanych linków'}
                  </>
                )
                ) : (
                  'Nie masz jeszcze żadnych linków'
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">

      {/* Statistics Panel - always visible */}
      <LinkStatisticsPanel />

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Szukaj w tytułach i opisach..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Szukaj linków"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SearchFilters
            selectedTagIds={selectedTagIds}
            onTagsChange={handleTagsChange}
            onClearFilters={handleClearFilters}
          />
          <SortSelector value={sortBy} onChange={handleSortChange} />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LinkCardSkeletonGrid count={6} viewMode={viewMode} />}

      {/* Links Grid or List */}
      {!isLoading && hasLinks && (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-3'
            }
          >
            {searchResult.links.map((link, index) => (
              <div
                key={link.id}
                className="animate-fade-in w-full"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <LinkCard
                  link={link}
                  onRefetch={refetch}
                  viewMode={viewMode}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={searchResult.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Empty States */}
      {!isLoading && !hasLinks && (
        <>
          {(query || hasActiveFilters) ? (
            <NoResultsState onClearFilters={handleClearFilters} />
          ) : (
            <EmptyState onAddLinkClick={handleOpenAddLinkDialog} />
          )}
        </>
      )}
      </div>
    </>
  )
}

function LinkCard({
  link,
  onRefetch,
  viewMode = 'grid',
}: {
  link: any
  onRefetch: () => void
  viewMode?: DefaultView
}) {
  const [localRating, setLocalRating] = useState(link.rating || null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleRatingChange = async (newRating: number | null) => {
    const previousRating = localRating

    // Optimistically update UI
    setLocalRating(newRating)

    startTransition(async () => {
      const result = await updateLink({
        id: link.id,
        rating: newRating,
      })

      if (result.success) {
        toast({
          title: 'Rating updated',
          description: newRating
            ? `Set to ${newRating} star${newRating !== 1 ? 's' : ''}`
            : 'Rating cleared',
        })
        // Refetch to update cache
        onRefetch()
      } else {
        // Rollback on error
        setLocalRating(previousRating)
        toast({
          title: 'Error',
          description: result.error || 'Failed to update rating',
          variant: 'destructive',
        })
      }
    })
  }

  // List view - compact horizontal layout
  if (viewMode === 'list') {
    return (
      <Card data-testid="link-card" className="w-full group hover:shadow-md transition-all duration-200 border hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 overflow-hidden">
            {/* Title and Link */}
            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 max-w-full"
              >
                <span className="truncate flex-1">{link.title || link.domain}</span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
              </a>
              <p className="text-xs text-gray-500 truncate mt-0.5">{link.domain}</p>
            </div>

            {/* Tags - compact */}
            <div className="flex-shrink-0 max-w-xs">
              {link.link_tags && link.link_tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {link.link_tags.slice(0, 3).map(
                    (linkTag: any) =>
                      linkTag.tag && (
                        <Badge key={linkTag.tag.id} variant="secondary" className="text-xs">
                          {linkTag.tag.name}
                        </Badge>
                      )
                  )}
                  {link.link_tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{link.link_tags.length - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">No tags</span>
              )}
            </div>

            {/* Rating */}
            <div className="flex-shrink-0">
              <StarRating
                value={localRating}
                onChange={handleRatingChange}
                size="sm"
                className={isPending ? 'opacity-50 pointer-events-none' : ''}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <EditLinkDialog link={link} onSuccess={onRefetch} />
              <DeleteLinkButton
                linkId={link.id}
                linkTitle={link.title || link.domain}
                onSuccess={onRefetch}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view - original card layout
  return (
    <Card data-testid="link-card" className="w-full group hover:shadow-lg hover:scale-[1.005] transition-all duration-300 border-2 hover:border-primary/20 h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Title and Link with Actions */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  <span className="truncate">{link.title || link.domain}</span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <p className="text-sm text-gray-500 truncate">{link.domain}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <EditLinkDialog link={link} onSuccess={onRefetch} />
                <DeleteLinkButton
                  linkId={link.id}
                  linkTitle={link.title || link.domain}
                  onSuccess={onRefetch}
                />
              </div>
            </div>

          {/* Description */}
          {link.ai_description && (
            <p className="text-gray-700 text-sm line-clamp-2">{link.ai_description}</p>
          )}

          {/* Tags - max 2 rows */}
          <div className="min-h-[56px] flex items-center">
            {link.link_tags && link.link_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[56px] overflow-hidden">
                {link.link_tags.map(
                  (linkTag: any) =>
                    linkTag.tag && (
                      <Badge key={linkTag.tag.id} variant="secondary">
                        {linkTag.tag.name}
                      </Badge>
                    )
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No tags</div>
            )}
          </div>
        </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-3 border-t mt-3">
            {/* Interactive Rating */}
            <StarRating
              value={localRating}
              onChange={handleRatingChange}
              size="sm"
              className={isPending ? 'opacity-50 pointer-events-none' : ''}
            />

            {/* Status */}
            <span className="text-xs text-gray-500">
              {link.ai_processing_status === 'completed' ? (
                'Przetworzono'
              ) : link.ai_processing_status === 'failed' ? (
                <span
                  className="text-red-600"
                  title={link.ai_processing_error || 'Scraping failed'}
                >
                  Błąd scrapingu
                </span>
              ) : (
                ''
              )}
            </span>
          </div>
      </CardContent>
    </Card>
  )
}

function NoResultsState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
        <ExternalLink className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Brak wyników</h3>
      <p className="text-gray-600 mb-4">
        Nie znaleziono linków pasujących do wybranych filtrów.
      </p>
      <button
        onClick={onClearFilters}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Wyczyść wszystkie filtry
      </button>
    </div>
  )
}