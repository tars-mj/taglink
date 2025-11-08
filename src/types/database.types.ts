export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      links: {
        Row: {
          id: string
          user_id: string
          url: string
          normalized_url: string
          domain: string
          title: string | null
          ai_description: string | null
          scraped_content: string | null
          rating: number | null
          ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processing_started_at: string | null
          ai_processing_completed_at: string | null
          ai_processing_error: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          normalized_url?: string
          domain?: string
          title?: string | null
          ai_description?: string | null
          scraped_content?: string | null
          rating?: number | null
          ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processing_started_at?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_error?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          normalized_url?: string
          domain?: string
          title?: string | null
          ai_description?: string | null
          scraped_content?: string | null
          rating?: number | null
          ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processing_started_at?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_error?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      link_tags: {
        Row: {
          link_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          link_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          link_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      rate_limit_violations: {
        Row: {
          id: string
          user_id: string
          violation_type: string
          attempted_at: string
          details: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          violation_type?: string
          attempted_at?: string
          details?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          violation_type?: string
          attempted_at?: string
          details?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}