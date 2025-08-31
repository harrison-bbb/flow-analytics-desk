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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      client_profile: {
        Row: {
          address: string | null
          business_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      executions_log: {
        Row: {
          automation_type: string | null
          created_at: string | null
          execution_date: string | null
          execution_details: string | null
          execution_status: string | null
          id: string
          metadata: Json | null
          money_saved: number | null
          n8n_workflow_id: string | null
          time_saved: number | null
          user_id: string | null
          workflow_name: string
        }
        Insert: {
          automation_type?: string | null
          created_at?: string | null
          execution_date?: string | null
          execution_details?: string | null
          execution_status?: string | null
          id?: string
          metadata?: Json | null
          money_saved?: number | null
          n8n_workflow_id?: string | null
          time_saved?: number | null
          user_id?: string | null
          workflow_name: string
        }
        Update: {
          automation_type?: string | null
          created_at?: string | null
          execution_date?: string | null
          execution_details?: string | null
          execution_status?: string | null
          id?: string
          metadata?: Json | null
          money_saved?: number | null
          n8n_workflow_id?: string | null
          time_saved?: number | null
          user_id?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          api_usage_percentage: number | null
          created_at: string | null
          executions_month: number | null
          id: string
          last_updated: string | null
          managed_workflows: number | null
          money_saved_month: number | null
          money_saved_total: number | null
          roi_percentage: number | null
          time_saved_month: number | null
          user_id: string | null
        }
        Insert: {
          api_usage_percentage?: number | null
          created_at?: string | null
          executions_month?: number | null
          id?: string
          last_updated?: string | null
          managed_workflows?: number | null
          money_saved_month?: number | null
          money_saved_total?: number | null
          roi_percentage?: number | null
          time_saved_month?: number | null
          user_id?: string | null
        }
        Update: {
          api_usage_percentage?: number | null
          created_at?: string | null
          executions_month?: number | null
          id?: string
          last_updated?: string | null
          managed_workflows?: number | null
          money_saved_month?: number | null
          money_saved_total?: number | null
          roi_percentage?: number | null
          time_saved_month?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_money_saved_per_run: number | null
          estimated_time_saved_per_run: number | null
          id: string
          n8n_workflow_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          workflow_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_money_saved_per_run?: number | null
          estimated_time_saved_per_run?: number | null
          id?: string
          n8n_workflow_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workflow_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_money_saved_per_run?: number | null
          estimated_time_saved_per_run?: number | null
          id?: string
          n8n_workflow_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalculate_user_metrics_simple: {
        Args: { target_user_id: string }
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
