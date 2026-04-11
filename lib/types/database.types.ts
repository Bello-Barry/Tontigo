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
      contributions: {
        Row: {
          amount: number
          created_at: string | null
          days_late: number | null
          due_date: string
          group_id: string
          id: string
          membership_id: string
          paid_at: string | null
          payment_reference: string | null
          penalty_amount: number | null
          status: Database["public"]["Enums"]["contribution_status"] | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          days_late?: number | null
          due_date: string
          group_id: string
          id?: string
          membership_id: string
          paid_at?: string | null
          payment_reference?: string | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          days_late?: number | null
          due_date?: string
          group_id?: string
          id?: string
          membership_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string | null
          evidence: string | null
          group_id: string
          id: string
          member_reported: string
          reason: string
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
        }
        Insert: {
          created_at?: string | null
          evidence?: string | null
          group_id: string
          id?: string
          member_reported: string
          reason: string
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
        }
        Update: {
          created_at?: string | null
          evidence?: string | null
          group_id?: string
          id?: string
          member_reported?: string
          reason?: string
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_member_reported_fkey"
            columns: ["member_reported"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_member_reported_fkey"
            columns: ["member_reported"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_vault_members: {
        Row: {
          id: string
          joined_at: string | null
          total_contributed: number | null
          user_id: string
          vault_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          total_contributed?: number | null
          user_id: string
          vault_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          total_contributed?: number | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_vault_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_vault_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_vault_members_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "group_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      group_vaults: {
        Row: {
          created_at: string | null
          creator_id: string
          current_balance: number | null
          description: string | null
          id: string
          invite_code: string | null
          name: string
          status: Database["public"]["Enums"]["vault_status"] | null
          target_amount: number | null
          unlock_date: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          current_balance?: number | null
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          status?: Database["public"]["Enums"]["vault_status"] | null
          target_amount?: number | null
          unlock_date: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          status?: Database["public"]["Enums"]["vault_status"] | null
          target_amount?: number | null
          unlock_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_vaults_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_vaults_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_requests: {
        Row: {
          amount_max: number
          amount_min: number
          created_at: string | null
          expires_at: string | null
          fee_paid: boolean | null
          frequency: Database["public"]["Enums"]["frequency_type"]
          id: string
          matched_group_id: string | null
          min_trust_score: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_max: number
          amount_min: number
          created_at?: string | null
          expires_at?: string | null
          fee_paid?: boolean | null
          frequency: Database["public"]["Enums"]["frequency_type"]
          id?: string
          matched_group_id?: string | null
          min_trust_score?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_max?: number
          amount_min?: number
          created_at?: string | null
          expires_at?: string | null
          fee_paid?: boolean | null
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          matched_group_id?: string | null
          min_trust_score?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_requests_matched_group_id_fkey"
            columns: ["matched_group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          group_id: string
          guarantee_amount: number | null
          guarantee_paid: boolean | null
          has_received_payout: boolean | null
          id: string
          joined_at: string | null
          payout_received_at: string | null
          status: Database["public"]["Enums"]["membership_status"] | null
          total_paid: number | null
          total_penalties: number | null
          turn_position: number
          user_id: string
        }
        Insert: {
          group_id: string
          guarantee_amount?: number | null
          guarantee_paid?: boolean | null
          has_received_payout?: boolean | null
          id?: string
          joined_at?: string | null
          payout_received_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"] | null
          total_paid?: number | null
          total_penalties?: number | null
          turn_position: number
          user_id: string
        }
        Update: {
          group_id?: string
          guarantee_amount?: number | null
          guarantee_paid?: boolean | null
          has_received_payout?: boolean | null
          id?: string
          joined_at?: string | null
          payout_received_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"] | null
          total_paid?: number | null
          total_penalties?: number | null
          turn_position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          commission_amount: number | null
          created_at: string | null
          group_id: string
          id: string
          membership_id: string
          net_amount: number
          paid_at: string | null
          payment_reference: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["payout_status"] | null
          turn_number: number
        }
        Insert: {
          amount: number
          commission_amount?: number | null
          created_at?: string | null
          group_id: string
          id?: string
          membership_id: string
          net_amount: number
          paid_at?: string | null
          payment_reference?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          turn_number: number
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          created_at?: string | null
          group_id?: string
          id?: string
          membership_id?: string
          net_amount?: number
          paid_at?: string | null
          payment_reference?: string | null
          recipient_id?: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_blacklist: {
        Row: {
          blacklisted_at: string | null
          id: string
          phone: string
          reason: string | null
        }
        Insert: {
          blacklisted_at?: string | null
          id?: string
          phone: string
          reason?: string | null
        }
        Update: {
          blacklisted_at?: string | null
          id?: string
          phone?: string
          reason?: string | null
        }
        Relationships: []
      }
      platform_revenues: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          source_id: string | null
          source_type: string | null
          type: Database["public"]["Enums"]["revenue_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string | null
          type: Database["public"]["Enums"]["revenue_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string | null
          type?: Database["public"]["Enums"]["revenue_type"]
        }
        Relationships: []
      }
      savings_contributions: {
        Row: {
          amount: number
          id: string
          paid_at: string | null
          payment_reference: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          amount: number
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          amount?: number
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "savings_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_vaults: {
        Row: {
          auto_amount: number | null
          created_at: string | null
          current_balance: number | null
          description: string | null
          frequency: Database["public"]["Enums"]["frequency_type"] | null
          id: string
          name: string
          status: Database["public"]["Enums"]["vault_status"] | null
          target_amount: number | null
          unlock_date: string
          unlocked_at: string | null
          user_id: string
          wallet_destination: string | null
        }
        Insert: {
          auto_amount?: number | null
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["vault_status"] | null
          target_amount?: number | null
          unlock_date: string
          unlocked_at?: string | null
          user_id: string
          wallet_destination?: string | null
        }
        Update: {
          auto_amount?: number | null
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["vault_status"] | null
          target_amount?: number | null
          unlock_date?: string
          unlocked_at?: string | null
          user_id?: string
          wallet_destination?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_vaults_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_vaults_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      solidarity_pool: {
        Row: {
          balance: number | null
          group_id: string
          id: string
          total_contributed: number | null
          total_used: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          group_id: string
          id?: string
          total_contributed?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          group_id?: string
          id?: string
          total_contributed?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solidarity_pool_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_groups: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          current_members: number | null
          current_turn: number | null
          description: string | null
          ends_at: string | null
          frequency: Database["public"]["Enums"]["frequency_type"]
          id: string
          invite_code: string | null
          is_public: boolean | null
          max_members: number
          min_trust_score: number | null
          name: string
          order_type: Database["public"]["Enums"]["order_type"] | null
          penalty_rate: number
          requires_guarantee: boolean | null
          solidarity_rate: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["group_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          current_members?: number | null
          current_turn?: number | null
          description?: string | null
          ends_at?: string | null
          frequency: Database["public"]["Enums"]["frequency_type"]
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          max_members: number
          min_trust_score?: number | null
          name: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          penalty_rate: number
          requires_guarantee?: boolean | null
          solidarity_rate?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["group_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          current_members?: number | null
          current_turn?: number | null
          description?: string | null
          ends_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          max_members?: number
          min_trust_score?: number | null
          name?: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          penalty_rate?: number
          requires_guarantee?: boolean | null
          solidarity_rate?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["group_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          external_reference: string | null
          id: string
          reference_id: string | null
          status: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_used: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          external_reference?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_used?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          external_reference?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          wallet_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          badge: Database["public"]["Enums"]["user_badge"] | null
          banned_until: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string
          id: string
          is_banned: boolean | null
          onboarding_done: boolean | null
          phone: string
          profession: string | null
          quartier: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          subscription_expires_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          total_groups_completed: number | null
          total_groups_failed: number | null
          trust_score: number | null
          updated_at: string | null
          wallet_airtel: string | null
          wallet_mtn: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge?: Database["public"]["Enums"]["user_badge"] | null
          banned_until?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string
          id: string
          is_banned?: boolean | null
          onboarding_done?: boolean | null
          phone: string
          profession?: string | null
          quartier?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          total_groups_completed?: number | null
          total_groups_failed?: number | null
          trust_score?: number | null
          updated_at?: string | null
          wallet_airtel?: string | null
          wallet_mtn?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge?: Database["public"]["Enums"]["user_badge"] | null
          banned_until?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string
          id?: string
          is_banned?: boolean | null
          onboarding_done?: boolean | null
          phone?: string
          profession?: string | null
          quartier?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          total_groups_completed?: number | null
          total_groups_failed?: number | null
          trust_score?: number | null
          updated_at?: string | null
          wallet_airtel?: string | null
          wallet_mtn?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_profile_complete: {
        Row: {
          id: string | null
          is_complete: boolean | null
        }
        Insert: {
          id?: string | null
          is_complete?: never
        }
        Update: {
          id?: string | null
          is_complete?: never
        }
        Relationships: []
      }
    }
    Functions: {
      apply_daily_penalties: { Args: never; Returns: undefined }
      calculate_guarantee: {
        Args: {
          p_amount: number
          p_max_members: number
          p_turn_position: number
        }
        Returns: number
      }
      increment_solidarity_pool: {
        Args: { p_amount: number; p_group_id: string }
        Returns: undefined
      }
      seize_guarantee_and_redistribute: {
        Args: {
          p_fugitive_user_id: string
          p_group_id: string
          p_guarantee_amount: number
        }
        Returns: undefined
      }
      unlock_matured_vaults: { Args: never; Returns: undefined }
      update_trust_score: {
        Args: { p_delta: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      contribution_status: "en_attente" | "paye" | "retard" | "penalise"
      dispute_status: "ouvert" | "en_cours" | "resolu" | "rejete"
      frequency_type: "quotidien" | "hebdomadaire" | "mensuel"
      group_status: "en_attente" | "actif" | "suspendu" | "termine"
      membership_status: "actif" | "suspect" | "elimine" | "fugitif"
      order_type: "tirage_au_sort" | "encheres" | "manuel"
      payout_status: "en_attente" | "verse" | "echoue"
      revenue_type:
        | "commission_payout"
        | "matching_fee"
        | "subscription"
        | "savings_withdrawal"
      subscription_plan: "free" | "pro"
      transaction_type:
        | "cotisation"
        | "versement"
        | "amende"
        | "garantie"
        | "epargne"
        | "retrait_epargne"
        | "solidarite"
        | "commission"
        | "matching_fee"
        | "abonnement"
      user_badge: "nouveau" | "fiable" | "expert" | "fraudeur"
      user_status: "actif" | "suspendu" | "banni"
      vault_status: "actif" | "debloque" | "termine"
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
      contribution_status: ["en_attente", "paye", "retard", "penalise"],
      dispute_status: ["ouvert", "en_cours", "resolu", "rejete"],
      frequency_type: ["quotidien", "hebdomadaire", "mensuel"],
      group_status: ["en_attente", "actif", "suspendu", "termine"],
      membership_status: ["actif", "suspect", "elimine", "fugitif"],
      order_type: ["tirage_au_sort", "encheres", "manuel"],
      payout_status: ["en_attente", "verse", "echoue"],
      revenue_type: [
        "commission_payout",
        "matching_fee",
        "subscription",
        "savings_withdrawal",
      ],
      subscription_plan: ["free", "pro"],
      transaction_type: [
        "cotisation",
        "versement",
        "amende",
        "garantie",
        "epargne",
        "retrait_epargne",
        "solidarite",
        "commission",
        "matching_fee",
        "abonnement",
      ],
      user_badge: ["nouveau", "fiable", "expert", "fraudeur"],
      user_status: ["actif", "suspendu", "banni"],
      vault_status: ["actif", "debloque", "termine"],
    },
  },
} as const
