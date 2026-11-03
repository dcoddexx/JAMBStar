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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          track: 'Science' | 'Arts' | 'Commercial'
          role: 'student' | 'admin' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          track: 'Science' | 'Arts' | 'Commercial'
          role?: 'student' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          track?: 'Science' | 'Arts' | 'Commercial'
          role?: 'student' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          icon: string | null
          is_compulsory: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          icon?: string | null
          is_compulsory?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          icon?: string | null
          is_compulsory?: boolean
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          subject_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: 'A' | 'B' | 'C' | 'D'
          explanation: string | null
          exam_year: number | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: 'A' | 'B' | 'C' | 'D'
          explanation?: string | null
          exam_year?: number | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_option?: 'A' | 'B' | 'C' | 'D'
          explanation?: string | null
          exam_year?: number | null
          image_url?: string | null
          created_at?: string
        }
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          score: number
          total_questions: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          score: number
          total_questions: number
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          score?: number
          total_questions?: number
          timestamp?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string | null
          guest_name: string | null
          guest_email: string | null
          subject: string
          category: string
          status: 'open' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_name?: string | null
          guest_email?: string | null
          subject: string
          category: string
          status?: 'open' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_name?: string | null
          guest_email?: string | null
          subject?: string
          category?: string
          status?: 'open' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string | null
          sender_name: string | null
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id?: string | null
          sender_name?: string | null
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string | null
          sender_name?: string | null
          message?: string
          created_at?: string
        }
      }
    }
  }
}
