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
          is_pro: boolean
          role: 'student' | 'admin' | 'super_admin'
          can_post_notices: boolean
          can_manage_users: boolean
          can_manage_questions: boolean
          can_manage_pro?: boolean
          can_manage_monetization_invites?: boolean
          can_view_monetization?: boolean
          can_manage_maintenance?: boolean
          monetization_status: 'none' | 'invited' | 'active' | 'declined'
          monetization_invited_at: string | null
          referral_code: string | null
          bank_name: string | null
          bank_code: string | null
          account_number: string | null
          account_name: string | null
          bank_details_updated_at: string | null
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
          is_pro?: boolean
          role?: 'student' | 'admin' | 'super_admin'
          can_post_notices?: boolean
          can_manage_users?: boolean
          can_manage_questions?: boolean
          can_manage_pro?: boolean
          can_manage_monetization_invites?: boolean
          can_view_monetization?: boolean
          can_manage_maintenance?: boolean
          monetization_status?: 'none' | 'invited' | 'active' | 'declined'
          monetization_invited_at?: string | null
          referral_code?: string | null
          bank_name?: string | null
          bank_code?: string | null
          account_number?: string | null
          account_name?: string | null
          bank_details_updated_at?: string | null
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
          is_pro?: boolean
          role?: 'student' | 'admin' | 'super_admin'
          can_post_notices?: boolean
          can_manage_users?: boolean
          can_manage_questions?: boolean
          can_manage_pro?: boolean
          can_manage_monetization_invites?: boolean
          can_view_monetization?: boolean
          can_manage_maintenance?: boolean
          monetization_status?: 'none' | 'invited' | 'active' | 'declined'
          monetization_invited_at?: string | null
          referral_code?: string | null
          bank_name?: string | null
          bank_code?: string | null
          account_number?: string | null
          account_name?: string | null
          bank_details_updated_at?: string | null
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
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_earned: number
          total_withdrawn: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_earned?: number
          total_withdrawn?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_earned?: number
          total_withdrawn?: number
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          reward_amount: number
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          reward_amount?: number
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          reward_amount?: number
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      payouts: {
        Row: {
          id: string
          user_id: string
          amount: number
          bank_name: string
          bank_code: string
          account_number: string
          account_name: string
          status: 'pending' | 'processing' | 'completed' | 'rejected'
          reference: string | null
          processed_at: string | null
          processed_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          bank_name: string
          bank_code: string
          account_number: string
          account_name: string
          status?: 'pending' | 'processing' | 'completed' | 'rejected'
          reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          bank_name?: string
          bank_code?: string
          account_number?: string
          account_name?: string
          status?: 'pending' | 'processing' | 'completed' | 'rejected'
          reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          is_maintenance: boolean
          maintenance_message: string
          maintenance_auto_on_at: string | null
          maintenance_auto_off_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          is_maintenance?: boolean
          maintenance_message?: string
          maintenance_auto_on_at?: string | null
          maintenance_auto_off_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          is_maintenance?: boolean
          maintenance_message?: string
          maintenance_auto_on_at?: string | null
          maintenance_auto_off_at?: string | null
          updated_at?: string
        }
      }
    }
  }
}
