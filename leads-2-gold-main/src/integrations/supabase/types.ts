export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_saved_searches: {
        Row: {
          created_at: string
          id: string
          industry_name: string | null
          lead_count: number | null
          location: string | null
          results_saved: boolean | null
          search_query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry_name?: string | null
          lead_count?: number | null
          location?: string | null
          results_saved?: boolean | null
          search_query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          industry_name?: string | null
          lead_count?: number | null
          location?: string | null
          results_saved?: boolean | null
          search_query?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      applicant_registrations: {
        Row: {
          applied_job_title: string | null
          certifications: string[] | null
          city: string | null
          created_at: string
          degree: string | null
          email: string
          fraternity_sorority: string | null
          gpa: number | null
          id: string
          name: string
          resume_url: string | null
          school: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          zip: string | null
        }
        Insert: {
          applied_job_title?: string | null
          certifications?: string[] | null
          city?: string | null
          created_at?: string
          degree?: string | null
          email: string
          fraternity_sorority?: string | null
          gpa?: number | null
          id?: string
          name: string
          resume_url?: string | null
          school?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          applied_job_title?: string | null
          certifications?: string[] | null
          city?: string | null
          created_at?: string
          degree?: string | null
          email?: string
          fraternity_sorority?: string | null
          gpa?: number | null
          id?: string
          name?: string
          resume_url?: string | null
          school?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          google_event_id: string | null
          id: string
          location: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_appointments: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          player_name: string | null
          preferred_date: string | null
          preferred_time: string | null
          status: string | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          player_name?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          player_name?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coaches: {
        Row: {
          average_rating: number | null
          bio: string | null
          city: string | null
          coach_type: string
          created_at: string
          email: string
          first_name: string
          id: string
          institution: string | null
          last_name: string
          phone_number: string | null
          profile_image_url: string | null
          program: string | null
          school: string | null
          sport: string
          state: string | null
          total_ratings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          coach_type: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          institution?: string | null
          last_name: string
          phone_number?: string | null
          profile_image_url?: string | null
          program?: string | null
          school?: string | null
          sport: string
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          coach_type?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          institution?: string | null
          last_name?: string
          phone_number?: string | null
          profile_image_url?: string | null
          program?: string | null
          school?: string | null
          sport?: string
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_code: string | null
          created_at: string
          credits: number | null
          description: string
          id: string
          name: string
        }
        Insert: {
          course_code?: string | null
          created_at?: string
          credits?: number | null
          description: string
          id?: string
          name: string
        }
        Update: {
          course_code?: string | null
          created_at?: string
          credits?: number | null
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      crm_prospects: {
        Row: {
          address: string | null
          ai_insights: Json | null
          best_call_times: Json | null
          business_type: string | null
          callback_notes: string | null
          city: string | null
          company_name: string
          contact_history: Json | null
          contact_name: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          google_busy_hours: Json | null
          google_rating: number | null
          google_reviews_count: number | null
          id: string
          industry_name: string | null
          instagram_url: string | null
          last_contacted_at: string | null
          lead_score: number | null
          lead_source: string | null
          linkedin_url: string | null
          next_callback_at: string | null
          notes: string | null
          pain_points: Json | null
          personalized_email: string | null
          phone: string | null
          search_query: string | null
          stage: string
          state: string | null
          suggested_products: string[] | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_insights?: Json | null
          best_call_times?: Json | null
          business_type?: string | null
          callback_notes?: string | null
          city?: string | null
          company_name: string
          contact_history?: Json | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          google_busy_hours?: Json | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          industry_name?: string | null
          instagram_url?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          linkedin_url?: string | null
          next_callback_at?: string | null
          notes?: string | null
          pain_points?: Json | null
          personalized_email?: string | null
          phone?: string | null
          search_query?: string | null
          stage?: string
          state?: string | null
          suggested_products?: string[] | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_insights?: Json | null
          best_call_times?: Json | null
          business_type?: string | null
          callback_notes?: string | null
          city?: string | null
          company_name?: string
          contact_history?: Json | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          google_busy_hours?: Json | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          industry_name?: string | null
          instagram_url?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          linkedin_url?: string | null
          next_callback_at?: string | null
          notes?: string | null
          pain_points?: Json | null
          personalized_email?: string | null
          phone?: string | null
          search_query?: string | null
          stage?: string
          state?: string | null
          suggested_products?: string[] | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      demo_accounts: {
        Row: {
          account_type: string
          balance: number
          created_at: string
          equity: number
          id: string
          margin_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          balance?: number
          created_at?: string
          equity?: number
          id?: string
          margin_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          balance?: number
          created_at?: string
          equity?: number
          id?: string
          margin_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          recipient_count: number | null
          sender_email: string
          sent_at: string | null
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_count?: number | null
          sender_email?: string
          sent_at?: string | null
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_count?: number | null
          sender_email?: string
          sent_at?: string | null
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employer_registrations: {
        Row: {
          company: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          keywords: string[] | null
          preferred_location: string | null
          preferred_requirement: string | null
          preferred_title: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          company: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          preferred_location?: string | null
          preferred_requirement?: string | null
          preferred_title?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          company?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          preferred_location?: string | null
          preferred_requirement?: string | null
          preferred_title?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      enriched_leads: {
        Row: {
          address: string | null
          ai_insights: Json | null
          best_call_times: Json | null
          company_name: string
          created_at: string | null
          email: string | null
          facebook_url: string | null
          google_busy_hours: Json | null
          google_rating: number | null
          google_reviews_count: number | null
          id: string
          industry_name: string
          instagram_url: string | null
          last_contacted_at: string | null
          lead_score: number | null
          linkedin_url: string | null
          location: string | null
          notes: string | null
          pain_points: Json | null
          personalized_email: string | null
          phone: string | null
          status: string | null
          suggested_products: string[] | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_insights?: Json | null
          best_call_times?: Json | null
          company_name: string
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          google_busy_hours?: Json | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          industry_name: string
          instagram_url?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          pain_points?: Json | null
          personalized_email?: string | null
          phone?: string | null
          status?: string | null
          suggested_products?: string[] | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_insights?: Json | null
          best_call_times?: Json | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          google_busy_hours?: Json | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          industry_name?: string
          instagram_url?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          pain_points?: Json | null
          personalized_email?: string | null
          phone?: string | null
          status?: string | null
          suggested_products?: string[] | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          created_at: string
          export_type: string
          exported_by: string | null
          filters: Json | null
          id: string
          record_count: number
        }
        Insert: {
          created_at?: string
          export_type: string
          exported_by?: string | null
          filters?: Json | null
          id?: string
          record_count: number
        }
        Update: {
          created_at?: string
          export_type?: string
          exported_by?: string | null
          filters?: Json | null
          id?: string
          record_count?: number
        }
        Relationships: []
      }
      free_trial_leads: {
        Row: {
          captured_at: string
          converted_to_paid: boolean | null
          created_at: string | null
          email: string
          id: string
          last_search_at: string | null
          name: string
          searches_used: number | null
          updated_at: string | null
        }
        Insert: {
          captured_at?: string
          converted_to_paid?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          last_search_at?: string | null
          name: string
          searches_used?: number | null
          updated_at?: string | null
        }
        Update: {
          captured_at?: string
          converted_to_paid?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          last_search_at?: string | null
          name?: string
          searches_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      general_invites: {
        Row: {
          created_at: string
          created_by: string | null
          custom_message: string | null
          expires_at: string
          id: string
          invite_code: string
          is_used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_message?: string | null
          expires_at?: string
          id?: string
          invite_code: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_message?: string | null
          expires_at?: string
          id?: string
          invite_code?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      highlight_grades: {
        Row: {
          comment: string | null
          created_at: string
          grade: number
          highlight_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          grade: number
          highlight_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          grade?: number
          highlight_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_grades_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_votes: {
        Row: {
          created_at: string
          highlight_id: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          highlight_id: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          highlight_id?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_votes_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          errors: Json | null
          id: string
          import_type: string
          imported_by: string | null
          record_count: number
        }
        Insert: {
          created_at?: string
          errors?: Json | null
          id?: string
          import_type: string
          imported_by?: string | null
          record_count: number
        }
        Update: {
          created_at?: string
          errors?: Json | null
          id?: string
          import_type?: string
          imported_by?: string | null
          record_count?: number
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          created_at: string
          description: string
          id: string
          job_type: string | null
          location: string | null
          required_skills: string[] | null
          salary_range: string | null
          title: string
        }
        Insert: {
          company: string
          created_at?: string
          description: string
          id?: string
          job_type?: string | null
          location?: string | null
          required_skills?: string[] | null
          salary_range?: string | null
          title: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string
          id?: string
          job_type?: string | null
          location?: string | null
          required_skills?: string[] | null
          salary_range?: string | null
          title?: string
        }
        Relationships: []
      }
      lead_campaigns: {
        Row: {
          created_at: string
          generated_count: number | null
          id: string
          industry_name: string
          location: string | null
          requested_count: number
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_count?: number | null
          id?: string
          industry_name: string
          location?: string | null
          requested_count: number
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_count?: number | null
          id?: string
          industry_name?: string
          location?: string | null
          requested_count?: number
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          industry_name: string
          lead_source: string | null
          notes: string | null
          phone: string | null
          rating: number | null
          state: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry_name: string
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry_name?: string
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_lead_usage: {
        Row: {
          created_at: string
          id: string
          leads_count: number
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leads_count?: number
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leads_count?: number
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nil_players: {
        Row: {
          apg: number | null
          bpg: number | null
          city: string | null
          college_offers: string | null
          committed_status: string | null
          contact_info: string | null
          created_at: string
          division: string | null
          gpa: number | null
          graduation_class: string | null
          height: string | null
          hudl_url: string | null
          id: string
          instagram_url: string | null
          maxpreps_url: string | null
          name: string
          position: string | null
          ppg: number | null
          rpg: number | null
          school: string | null
          sport: string | null
          state: string | null
          team: string | null
          thumbnail_url: string | null
          twitter_url: string | null
          two47_url: string | null
          updated_at: string
          user_id: string | null
          vertical: number | null
          video_url: string | null
          weight: string | null
        }
        Insert: {
          apg?: number | null
          bpg?: number | null
          city?: string | null
          college_offers?: string | null
          committed_status?: string | null
          contact_info?: string | null
          created_at?: string
          division?: string | null
          gpa?: number | null
          graduation_class?: string | null
          height?: string | null
          hudl_url?: string | null
          id?: string
          instagram_url?: string | null
          maxpreps_url?: string | null
          name: string
          position?: string | null
          ppg?: number | null
          rpg?: number | null
          school?: string | null
          sport?: string | null
          state?: string | null
          team?: string | null
          thumbnail_url?: string | null
          twitter_url?: string | null
          two47_url?: string | null
          updated_at?: string
          user_id?: string | null
          vertical?: number | null
          video_url?: string | null
          weight?: string | null
        }
        Update: {
          apg?: number | null
          bpg?: number | null
          city?: string | null
          college_offers?: string | null
          committed_status?: string | null
          contact_info?: string | null
          created_at?: string
          division?: string | null
          gpa?: number | null
          graduation_class?: string | null
          height?: string | null
          hudl_url?: string | null
          id?: string
          instagram_url?: string | null
          maxpreps_url?: string | null
          name?: string
          position?: string | null
          ppg?: number | null
          rpg?: number | null
          school?: string | null
          sport?: string | null
          state?: string | null
          team?: string | null
          thumbnail_url?: string | null
          twitter_url?: string | null
          two47_url?: string | null
          updated_at?: string
          user_id?: string | null
          vertical?: number | null
          video_url?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          placed_at: string | null
          restaurant_id: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          placed_at?: string | null
          restaurant_id: string
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          placed_at?: string | null
          restaurant_id?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_profiles: {
        Row: {
          average_rating: number | null
          city: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          organization_name: string
          organization_type: string
          phone_number: string | null
          profile_image_url: string | null
          school_level: string | null
          state: string | null
          total_ratings: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          average_rating?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          email: string
          id?: string
          organization_name: string
          organization_type: string
          phone_number?: string | null
          profile_image_url?: string | null
          school_level?: string | null
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          average_rating?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          organization_name?: string
          organization_type?: string
          phone_number?: string | null
          profile_image_url?: string | null
          school_level?: string | null
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          ig_handle: string | null
          name: string
          notes: string | null
          sports: string | null
          state: string | null
          tiktok_handle: string | null
          type: string | null
          updated_at: string
          website: string | null
          x_handle: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          ig_handle?: string | null
          name: string
          notes?: string | null
          sports?: string | null
          state?: string | null
          tiktok_handle?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
          x_handle?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          ig_handle?: string | null
          name?: string
          notes?: string | null
          sports?: string | null
          state?: string | null
          tiktok_handle?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
          x_handle?: string | null
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          average_rating: number | null
          bio: string | null
          children_info: Json | null
          children_names: string[] | null
          city: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          location: string | null
          phone_number: string | null
          profile_image_url: string | null
          sport: string | null
          state: string | null
          total_ratings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          children_info?: Json | null
          children_names?: string[] | null
          city?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          location?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          sport?: string | null
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          children_info?: Json | null
          children_names?: string[] | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          location?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          sport?: string | null
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string
          email: string | null
          first_name: string
          gender: string
          graduation_year: string
          height: string | null
          id: string
          is_complete: boolean | null
          last_name: string
          location: string
          position: string
          profile_image_url: string | null
          school: string
          sport: string
          total_ratings: number | null
          updated_at: string
          user_id: string
          weight: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          gender: string
          graduation_year: string
          height?: string | null
          id?: string
          is_complete?: boolean | null
          last_name: string
          location: string
          position: string
          profile_image_url?: string | null
          school: string
          sport: string
          total_ratings?: number | null
          updated_at?: string
          user_id: string
          weight?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          gender?: string
          graduation_year?: string
          height?: string | null
          id?: string
          is_complete?: boolean | null
          last_name?: string
          location?: string
          position?: string
          profile_image_url?: string | null
          school?: string
          sport?: string
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
          weight?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string
          current_age: number | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          graduation_year: string | null
          id: string
          jersey_number: number | null
          last_name: string
          school_last_year: string | null
          school_next_year: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_age?: number | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          graduation_year?: string | null
          id?: string
          jersey_number?: number | null
          last_name: string
          school_last_year?: string | null
          school_next_year?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_age?: number | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          graduation_year?: string | null
          id?: string
          jersey_number?: number | null
          last_name?: string
          school_last_year?: string | null
          school_next_year?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          created_at: string
          date_recorded: string | null
          description: string | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          position: string | null
          sport: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          upload_status: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          date_recorded?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          position?: string | null
          sport: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          upload_status?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          date_recorded?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          position?: string | null
          sport?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          upload_status?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          in_stock: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          in_stock?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          in_stock?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_links: {
        Row: {
          created_at: string
          id: string
          parent_profile_id: string | null
          player_profile_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parent_profile_id?: string | null
          player_profile_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parent_profile_id?: string | null
          player_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "parent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_player_profile_id_fkey"
            columns: ["player_profile_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          profile_id: string
          profile_type: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id: string
          profile_type: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          profile_type?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prospects: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          industry_id: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          rating: number
          reviews: number
          source: string
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          rating?: number
          reviews?: number
          source?: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          rating?: number
          reviews?: number
          source?: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          expires_at: string
          id: string
          is_used: boolean | null
          max_uses: number | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          max_uses?: number | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          max_uses?: number | null
          used_by?: string | null
        }
        Relationships: []
      }
      registration_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          invite_code: string
          is_used: boolean
          parent_email: string
          parent_first_name: string
          parent_last_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          invite_code: string
          is_used?: boolean
          parent_email: string
          parent_first_name: string
          parent_last_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          invite_code?: string
          is_used?: boolean
          parent_email?: string
          parent_first_name?: string
          parent_last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          id: string
          party_size: number
          reserved_at: string
          restaurant_id: string
          special_requests: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          party_size: number
          reserved_at: string
          restaurant_id: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          party_size?: number
          reserved_at?: string
          restaurant_id?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          open_hours: Json | null
          owner_id: string
          phone: string | null
          price_level: number | null
          rating: number | null
          state: string | null
          total_ratings: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          open_hours?: Json | null
          owner_id: string
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          open_hours?: Json | null
          owner_id?: string
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          state?: string | null
          total_ratings?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          created_at: string
          email: string
          follow_up_notes: string | null
          follow_up_status: string | null
          follow_up_type: string | null
          id: string
          last_contact_date: string | null
          name: string
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          follow_up_notes?: string | null
          follow_up_status?: string | null
          follow_up_type?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          follow_up_notes?: string | null
          follow_up_status?: string | null
          follow_up_type?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          id: string
          skill_level: string | null
          skill_name: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          skill_level?: string | null
          skill_name: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          skill_level?: string | null
          skill_name?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          restaurant_id: string
          role: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          restaurant_id: string
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          restaurant_id?: string
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          gpa: string
          graduation_year: string | null
          id: string
          location: string | null
          major: string
          name: string
          university: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          gpa: string
          graduation_year?: string | null
          id?: string
          location?: string | null
          major: string
          name: string
          university: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          gpa?: string
          graduation_year?: string | null
          id?: string
          location?: string | null
          major?: string
          name?: string
          university?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_settings: {
        Row: {
          basic_access_enabled: boolean
          id: string
          premium_access_enabled: boolean
          subscription_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          basic_access_enabled?: boolean
          id?: string
          premium_access_enabled?: boolean
          subscription_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          basic_access_enabled?: boolean
          id?: string
          premium_access_enabled?: boolean
          subscription_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      team_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          media_type: string | null
          team_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          media_type?: string | null
          team_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          media_type?: string | null
          team_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_gallery_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          author_name: string
          author_role: string
          content: string
          created_at: string
          id: string
          is_announcement: boolean
          is_pinned: boolean
          parent_id: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          author_role?: string
          content: string
          created_at?: string
          id?: string
          is_announcement?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          author_role?: string
          content?: string
          created_at?: string
          id?: string
          is_announcement?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          created_at: string
          grade: string | null
          id: string
          image_url: string | null
          name: string
          position: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade?: string | null
          id?: string
          image_url?: string | null
          name: string
          position?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          opponent: string | null
          start_time: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          id?: string
          location?: string | null
          opponent?: string | null
          start_time?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          opponent?: string | null
          start_time?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          coach_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          graduation_year: number
          id: string
          name: string
          sport: string
          updated_at: string
        }
        Insert: {
          coach_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          graduation_year: number
          id?: string
          name: string
          sport?: string
          updated_at?: string
        }
        Update: {
          coach_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          graduation_year?: number
          id?: string
          name?: string
          sport?: string
          updated_at?: string
        }
        Relationships: []
      }
      trading_positions: {
        Row: {
          asset_type: string
          closed_at: string | null
          created_at: string
          current_price: number
          demo_account_id: string
          entry_price: number
          exit_price: number | null
          id: string
          leverage: number
          pnl: number
          position_type: string
          size: number
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          closed_at?: string | null
          created_at?: string
          current_price: number
          demo_account_id: string
          entry_price: number
          exit_price?: number | null
          id?: string
          leverage?: number
          pnl?: number
          position_type: string
          size: number
          status?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          closed_at?: string | null
          created_at?: string
          current_price?: number
          demo_account_id?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          leverage?: number
          pnl?: number
          position_type?: string
          size?: number
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_positions_demo_account_id_fkey"
            columns: ["demo_account_id"]
            isOneToOne: false
            referencedRelation: "demo_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_awards: {
        Row: {
          award_date: string | null
          award_name: string
          created_at: string
          description: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          award_date?: string | null
          award_name: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          award_date?: string | null
          award_name?: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          course_id: string | null
          created_at: string
          grade: string | null
          id: string
          semester: string | null
          user_id: string | null
          year: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          semester?: string | null
          user_id?: string | null
          year?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          semester?: string | null
          user_id?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_job_matches: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          match_reason: string | null
          match_score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          match_reason?: string | null
          match_score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          match_reason?: string | null
          match_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metadata: {
        Row: {
          created_at: string
          id: string
          signup_data: Json | null
          updated_at: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          signup_data?: Json | null
          updated_at?: string
          user_id?: string | null
          user_type: string
        }
        Update: {
          created_at?: string
          id?: string
          signup_data?: Json | null
          updated_at?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
          webhook_type: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_subscription_status: {
        Args: { user_email?: string }
        Returns: {
          has_access: boolean
          subscribed: boolean
          subscription_end: string
          subscription_tier: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_email?: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "premium"],
    },
  },
} as const
