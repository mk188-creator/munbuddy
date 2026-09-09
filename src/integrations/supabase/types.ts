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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          coin_reward: number
          cosmetic_key: string | null
          crate_reward: string | null
          created_at: string
          description: string
          goal: number
          icon: string
          id: string
          key: string
          metric: string
          rarity: string
          title: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          cosmetic_key?: string | null
          crate_reward?: string | null
          created_at?: string
          description?: string
          goal?: number
          icon?: string
          id?: string
          key: string
          metric?: string
          rarity?: string
          title: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          cosmetic_key?: string | null
          crate_reward?: string | null
          created_at?: string
          description?: string
          goal?: number
          icon?: string
          id?: string
          key?: string
          metric?: string
          rarity?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          tokens: number
          tool: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tokens?: number
          tool: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tokens?: number
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_mutes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          muted_by: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string | null
          reason?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_reads: {
        Row: {
          last_read_at: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          tool: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          tool?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          tool?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_warnings: {
        Row: {
          created_at: string
          id: string
          issued_by: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_by?: string | null
          reason?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_by?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          announcement: boolean
          body: string
          created_at: string
          deleted: boolean
          id: string
          image_url: string | null
          mentions: Json
          pinned: boolean
          reply_to: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement?: boolean
          body?: string
          created_at?: string
          deleted?: boolean
          id?: string
          image_url?: string | null
          mentions?: Json
          pinned?: boolean
          reply_to?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement?: boolean
          body?: string
          created_at?: string
          deleted?: boolean
          id?: string
          image_url?: string | null
          mentions?: Json
          pinned?: boolean
          reply_to?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_bookmarks: {
        Row: {
          conference_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          conference_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          conference_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_bookmarks_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      conferences: {
        Row: {
          banner_url: string | null
          city: string
          committees: Json
          contact_email: string
          contact_phone: string
          country: string
          created_at: string
          delegate_fee: string
          description: string
          end_date: string | null
          id: string
          instagram_url: string
          linkedin_url: string
          logo_url: string | null
          mode: string
          name: string
          published: boolean
          registration_url: string
          slug: string
          start_date: string | null
          tagline: string
          twitter_url: string
          updated_at: string
          user_id: string
          venue: string
          website_url: string
        }
        Insert: {
          banner_url?: string | null
          city?: string
          committees?: Json
          contact_email?: string
          contact_phone?: string
          country?: string
          created_at?: string
          delegate_fee?: string
          description?: string
          end_date?: string | null
          id?: string
          instagram_url?: string
          linkedin_url?: string
          logo_url?: string | null
          mode?: string
          name: string
          published?: boolean
          registration_url?: string
          slug: string
          start_date?: string | null
          tagline?: string
          twitter_url?: string
          updated_at?: string
          user_id: string
          venue?: string
          website_url?: string
        }
        Update: {
          banner_url?: string | null
          city?: string
          committees?: Json
          contact_email?: string
          contact_phone?: string
          country?: string
          created_at?: string
          delegate_fee?: string
          description?: string
          end_date?: string | null
          id?: string
          instagram_url?: string
          linkedin_url?: string
          logo_url?: string | null
          mode?: string
          name?: string
          published?: boolean
          registration_url?: string
          slug?: string
          start_date?: string | null
          tagline?: string
          twitter_url?: string
          updated_at?: string
          user_id?: string
          venue?: string
          website_url?: string
        }
        Relationships: []
      }
      cosmetics: {
        Row: {
          created_at: string
          founder_only: boolean
          id: string
          key: string
          kind: string
          name: string
          payload: Json
          price: number
          rarity: string
          seasonal: boolean
        }
        Insert: {
          created_at?: string
          founder_only?: boolean
          id?: string
          key: string
          kind: string
          name: string
          payload?: Json
          price?: number
          rarity?: string
          seasonal?: boolean
        }
        Update: {
          created_at?: string
          founder_only?: boolean
          id?: string
          key?: string
          kind?: string
          name?: string
          payload?: Json
          price?: number
          rarity?: string
          seasonal?: boolean
        }
        Relationships: []
      }
      crate_openings: {
        Row: {
          created_at: string
          id: string
          rarity: string
          reward: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rarity: string
          reward?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rarity?: string
          reward?: Json
          user_id?: string
        }
        Relationships: []
      }
      dm_blocks: {
        Row: {
          blocked_id: string
          created_at: string
          id: string
          muted: boolean
          user_id: string
        }
        Insert: {
          blocked_id: string
          created_at?: string
          id?: string
          muted?: boolean
          user_id: string
        }
        Update: {
          blocked_id?: string
          created_at?: string
          id?: string
          muted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          body: string
          created_at: string
          deleted: boolean
          id: string
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          deleted?: boolean
          id?: string
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted?: boolean
          id?: string
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string
          doc_type: string
          folder_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          doc_type?: string
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          doc_type?: string
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      message_flags: {
        Row: {
          action: string
          categories: Json
          content: string
          created_at: string
          id: string
          message_id: string | null
          reviewed_by: string | null
          severity: string
          status: string
          surface: string
          user_id: string
        }
        Insert: {
          action?: string
          categories?: Json
          content?: string
          created_at?: string
          id?: string
          message_id?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          surface?: string
          user_id: string
        }
        Update: {
          action?: string
          categories?: Json
          content?: string
          created_at?: string
          id?: string
          message_id?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          surface?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_templates: {
        Row: {
          active: boolean
          cadence: string
          coin_reward: number
          crate_reward: string | null
          created_at: string
          description: string
          goal: number
          id: string
          key: string
          metric: string
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          cadence?: string
          coin_reward?: number
          crate_reward?: string | null
          created_at?: string
          description?: string
          goal?: number
          id?: string
          key: string
          metric: string
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          cadence?: string
          coin_reward?: number
          crate_reward?: string | null
          created_at?: string
          description?: string
          goal?: number
          id?: string
          key?: string
          metric?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          message_id: string | null
          reason: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          entity_id: string | null
          id: string
          link: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          link?: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          link?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          country: string
          created_at: string
          display_name: string
          email_notifications: boolean
          equipped_background: string | null
          equipped_chat_effect: string | null
          equipped_frame: string | null
          equipped_rank: string | null
          equipped_title: string | null
          full_name: string
          id: string
          last_seen_at: string
          mun_experience: string
          product_updates: boolean
          public_profile: boolean
          school: string
          showcase: Json
          theme: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          country?: string
          created_at?: string
          display_name?: string
          email_notifications?: boolean
          equipped_background?: string | null
          equipped_chat_effect?: string | null
          equipped_frame?: string | null
          equipped_rank?: string | null
          equipped_title?: string | null
          full_name?: string
          id: string
          last_seen_at?: string
          mun_experience?: string
          product_updates?: boolean
          public_profile?: boolean
          school?: string
          showcase?: Json
          theme?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          country?: string
          created_at?: string
          display_name?: string
          email_notifications?: boolean
          equipped_background?: string | null
          equipped_chat_effect?: string | null
          equipped_frame?: string | null
          equipped_rank?: string | null
          equipped_title?: string | null
          full_name?: string
          id?: string
          last_seen_at?: string
          mun_experience?: string
          product_updates?: boolean
          public_profile?: boolean
          school?: string
          showcase?: Json
          theme?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ranks: {
        Row: {
          animation: string
          color: string
          created_at: string
          icon: string
          id: string
          key: string
          label: string
          min_level: number
          priority: number
          updated_at: string
        }
        Insert: {
          animation?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          key: string
          label: string
          min_level?: number
          priority?: number
          updated_at?: string
        }
        Update: {
          animation?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          key?: string
          label?: string
          min_level?: number
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string
          id: string
          message_id: string | null
          reason: string
          reporter_id: string
          resolution: string
          reviewed_by: string | null
          status: string
          surface: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          message_id?: string | null
          reason: string
          reporter_id: string
          resolution?: string
          reviewed_by?: string | null
          status?: string
          surface?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          message_id?: string | null
          reason?: string
          reporter_id?: string
          resolution?: string
          reviewed_by?: string | null
          status?: string
          surface?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_rotation: {
        Row: {
          cosmetic_id: string
          created_at: string
          discount_pct: number
          featured: boolean
          id: string
          rotation_date: string
        }
        Insert: {
          cosmetic_id: string
          created_at?: string
          discount_pct?: number
          featured?: boolean
          id?: string
          rotation_date: string
        }
        Update: {
          cosmetic_id?: string
          created_at?: string
          discount_pct?: number
          featured?: boolean
          id?: string
          rotation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_rotation_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cosmetics: {
        Row: {
          acquired_from: string
          cosmetic_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          acquired_from?: string
          cosmetic_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          acquired_from?: string
          cosmetic_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cosmetics_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_crates: {
        Row: {
          id: string
          quantity: number
          rarity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          quantity?: number
          rarity: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          quantity?: number
          rarity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          cadence: string
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          period_start: string
          progress: number
          template_id: string
          user_id: string
        }
        Insert: {
          cadence?: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          period_start: string
          progress?: number
          template_id: string
          user_id: string
        }
        Update: {
          cadence?: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          period_start?: string
          progress?: number
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "mission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ranks: {
        Row: {
          created_at: string
          id: string
          rank_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rank_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rank_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ranks_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          best_streak: number
          coins: number
          conference_count: number
          crate_keys: number
          created_at: string
          last_login_date: string | null
          level: number
          lifetime_xp: number
          login_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          best_streak?: number
          coins?: number
          conference_count?: number
          crate_keys?: number
          created_at?: string
          last_login_date?: string | null
          level?: number
          lifetime_xp?: number
          login_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          best_streak?: number
          coins?: number
          conference_count?: number
          crate_keys?: number
          created_at?: string
          last_login_date?: string | null
          level?: number
          lifetime_xp?: number
          login_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          coins: number
          created_at: string
          id: string
          meta: Json
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          coins?: number
          created_at?: string
          id?: string
          meta?: Json
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          coins?: number
          created_at?: string
          id?: string
          meta?: Json
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_muted: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "founder" | "admin" | "staff" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["founder", "admin", "staff", "moderator", "user"],
    },
  },
} as const
