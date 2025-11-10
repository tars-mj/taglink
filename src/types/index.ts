import { Database } from './database.types'

export type Link = Database['public']['Tables']['links']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type LinkTag = Database['public']['Tables']['link_tags']['Row']
export type RateLimitViolation = Database['public']['Tables']['rate_limit_violations']['Row']

export type LinkStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface LinkWithTags extends Link {
  tags?: Tag[]
  link_tags?: Array<{
    tag: Tag
  }>
}

export interface TagWithCount extends Tag {
  link_count?: number
}

export interface CreateLinkInput {
  url: string
  title?: string
  ai_description?: string
  rating?: number
}

export interface UpdateLinkInput {
  title?: string
  ai_description?: string
  rating?: number
  tag_ids?: string[]
}

export interface CreateTagInput {
  name: string
}

export interface SearchFilters {
  query?: string
  tag_ids?: string[]
  rating?: number
  sort_by?: 'rating' | 'created_at' | 'relevance'
  sort_order?: 'asc' | 'desc'
}

// User Preferences (Sprint 9)
export type DefaultView = 'grid' | 'list'
export type LinksPerPage = 12 | 24 | 48
export type DefaultSort = 'rating-desc' | 'date-desc' | 'date-asc' | 'relevance'

export interface UserPreferences {
  user_id: string
  default_view: DefaultView
  links_per_page: LinksPerPage
  default_sort: DefaultSort
  ai_processing_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UpdatePreferencesInput {
  default_view?: DefaultView
  links_per_page?: LinksPerPage
  default_sort?: DefaultSort
  ai_processing_enabled?: boolean
}