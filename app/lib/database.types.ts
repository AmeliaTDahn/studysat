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
      calendar_events: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          title: string
          description: string | null
          event_type: 'test' | 'homework' | 'study_session' | 'other'
          start_date: string
          end_date: string | null
          all_day: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          title: string
          description?: string | null
          event_type: 'test' | 'homework' | 'study_session' | 'other'
          start_date: string
          end_date?: string | null
          all_day?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          title?: string
          description?: string | null
          event_type?: 'test' | 'homework' | 'study_session' | 'other'
          start_date?: string
          end_date?: string | null
          all_day?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
          updated_at?: string
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