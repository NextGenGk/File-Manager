// Database types based on the SQL schema

export interface Database {
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
      files: {
        Row: {
          id: string
          user_id: string
          name: string
          path: string
          size: number
          is_folder: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          path: string
          size?: number
          is_folder?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          path?: string
          size?: number
          is_folder?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
