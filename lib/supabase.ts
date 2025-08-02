import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          first_name: string | null
          last_name: string | null
          image_url: string | null
          created_at: string
          updated_at: string
          storage_quota: number
          storage_used: number
          bucket_prefix: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          storage_quota?: number
          storage_used?: number
          bucket_prefix: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          storage_quota?: number
          storage_used?: number
          bucket_prefix?: string
        }
      }
      user_files: {
        Row: {
          id: string
          user_id: string
          s3_key: string
          file_name: string
          file_size: number
          content_type: string | null
          uploaded_at: string
          last_accessed: string
          folder_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          s3_key: string
          file_name: string
          file_size: number
          content_type?: string | null
          uploaded_at?: string
          last_accessed?: string
          folder_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          s3_key?: string
          file_name?: string
          file_size?: number
          content_type?: string | null
          uploaded_at?: string
          last_accessed?: string
          folder_id?: string | null
        }
      }
      user_folders: {
        Row: {
          id: string
          user_id: string
          folder_name: string
          s3_prefix: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_name: string
          s3_prefix: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_name?: string
          s3_prefix?: string
          parent_id?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
