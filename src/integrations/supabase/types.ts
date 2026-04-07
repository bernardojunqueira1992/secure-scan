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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      findings: {
        Row: {
          content_hash: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          metadata: Json | null
          remediation: string | null
          scan_id: string
          severity: string
          title: string
          type: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          remediation?: string | null
          scan_id: string
          severity: string
          title: string
          type: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          remediation?: string | null
          scan_id?: string
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          api_access: boolean
          created_at: string
          id: string
          max_urls: number
          name: string
          price_cents: number
          scans_per_month: number
        }
        Insert: {
          api_access?: boolean
          created_at?: string
          id?: string
          max_urls: number
          name: string
          price_cents: number
          scans_per_month: number
        }
        Update: {
          api_access?: boolean
          created_at?: string
          id?: string
          max_urls?: number
          name?: string
          price_cents?: number
          scans_per_month?: number
        }
        Relationships: []
      }
      scan_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          heartbeat_at: string | null
          id: string
          max_attempts: number | null
          priority: number | null
          retry_after: string | null
          scan_id: string
          session_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          heartbeat_at?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          retry_after?: string | null
          scan_id: string
          session_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          heartbeat_at?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          retry_after?: string | null
          scan_id?: string
          session_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_queue_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_queue_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_sessions: {
        Row: {
          cookies_encrypted: string
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          updated_at: string
          url_pattern: string
          user_id: string
        }
        Insert: {
          cookies_encrypted: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          updated_at?: string
          url_pattern: string
          user_id: string
        }
        Update: {
          cookies_encrypted?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          url_pattern?: string
          user_id?: string
        }
        Relationships: []
      }
      scanner_heartbeats: {
        Row: {
          active_scans: number | null
          browser_pool_size: number | null
          id: string
          last_seen_at: string | null
          status: string | null
        }
        Insert: {
          active_scans?: number | null
          browser_pool_size?: number | null
          id?: string
          last_seen_at?: string | null
          status?: string | null
        }
        Update: {
          active_scans?: number | null
          browser_pool_size?: number | null
          id?: string
          last_seen_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          page_title: string | null
          scan_duration_ms: number | null
          score: number | null
          screenshot_url: string | null
          session_id: string | null
          status: string
          url: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          page_title?: string | null
          scan_duration_ms?: number | null
          score?: number | null
          screenshot_url?: string | null
          session_id?: string | null
          status?: string
          url: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          page_title?: string | null
          scan_duration_ms?: number | null
          score?: number | null
          screenshot_url?: string | null
          session_id?: string | null
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_scans: {
        Row: {
          alert_threshold: number | null
          created_at: string
          cron_schedule: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          notification_email: string | null
          notification_slack_webhook: string | null
          session_id: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string
          cron_schedule: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          notification_email?: string | null
          notification_slack_webhook?: string | null
          session_id?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string
          cron_schedule?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          notification_email?: string | null
          notification_slack_webhook?: string | null
          session_id?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_scan_quota: { Args: { p_user_id: string }; Returns: boolean }
      complete_scan_job:
        | {
            Args: {
              p_duration_ms: number
              p_findings: Json
              p_job_id: string
              p_scan_id: string
              p_score: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_duration_ms: number
              p_findings?: Json
              p_job_id: string
              p_page_title?: string
              p_scan_id: string
              p_score: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_duration_ms: number
              p_findings?: Json
              p_job_id: string
              p_metadata?: Json
              p_page_title?: string
              p_scan_id: string
              p_score: number
            }
            Returns: undefined
          }
      dequeue_scan_job: {
        Args: never
        Returns: {
          job_id: string
          scan_id: string
          session_id: string
          url: string
        }[]
      }
      fail_scan_job: {
        Args: { p_error: string; p_job_id: string; p_scan_id: string }
        Returns: boolean
      }
      get_session_cookies: {
        Args: { p_session_id: string }
        Returns: {
          cookies_encrypted: string
          url_pattern: string
        }[]
      }
      reap_stuck_jobs: { Args: never; Returns: number }
      scanner_heartbeat: {
        Args: { p_active: number; p_pool_size: number; p_scanner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
