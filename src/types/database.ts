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
          gender: 'male' | 'female'
          tier: 'free' | 'pro'
          role: 'student' | 'admin' | 'super_admin'
          can_post_notices: boolean
          can_manage_users: boolean
          can_manage_questions: boolean
          can_manage_pro?: boolean
          last_read_notices: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          track: 'Science' | 'Arts' | 'Commercial'
          gender?: 'male' | 'female'
          tier?: 'free' | 'pro'
          role?: 'student' | 'admin' | 'super_admin'
          can_post_notices?: boolean
          can_manage_users?: boolean
          can_manage_questions?: boolean
          can_manage_pro?: boolean
          last_read_notices?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          track?: 'Science' | 'Arts' | 'Commercial'
          gender?: 'male' | 'female'
          tier?: 'free' | 'pro'
          role?: 'student' | 'admin' | 'super_admin'
          can_post_notices?: boolean
          can_manage_users?: boolean
          can_manage_questions?: boolean
          can_manage_pro?: boolean
          last_read_notices?: string | null
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
      topics: {
        Row: {
          id: string
          subject_id: string
          name: string
          code: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          name: string
          code?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          name?: string
          code?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subtopics: {
        Row: {
          id: string
          topic_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          subject_id: string
          topic_id: string | null
          subtopic_id: string | null
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: 'A' | 'B' | 'C' | 'D'
          explanation: string | null
          exam_year: number | null
          image_url: string | null
          difficulty_level: 'easy' | 'medium' | 'hard' | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          topic_id?: string | null
          subtopic_id?: string | null
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: 'A' | 'B' | 'C' | 'D'
          explanation?: string | null
          exam_year?: number | null
          image_url?: string | null
          difficulty_level?: 'easy' | 'medium' | 'hard' | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          topic_id?: string | null
          subtopic_id?: string | null
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_option?: 'A' | 'B' | 'C' | 'D'
          explanation?: string | null
          exam_year?: number | null
          image_url?: string | null
          difficulty_level?: 'easy' | 'medium' | 'hard' | null
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
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id?: string | null
          sender_name?: string | null
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string | null
          sender_name?: string | null
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
