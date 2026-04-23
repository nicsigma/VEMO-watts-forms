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
      ex1_activation_fee: {
        Row: {
          clearer_choice: Database["public"]["Enums"]["ab_choice"] | null
          comparison_reason: string | null
          created_at: string
          fairer_choice: Database["public"]["Enums"]["ab_choice"] | null
          id: string
          pay_choice: Database["public"]["Enums"]["ab_choice"] | null
          permanent_choice: Database["public"]["Enums"]["abe_choice"] | null
          permanent_reason: string | null
          submission_id: string
          ticket_a_observation: string | null
          ticket_b_observation: string | null
          updated_at: string
        }
        Insert: {
          clearer_choice?: Database["public"]["Enums"]["ab_choice"] | null
          comparison_reason?: string | null
          created_at?: string
          fairer_choice?: Database["public"]["Enums"]["ab_choice"] | null
          id?: string
          pay_choice?: Database["public"]["Enums"]["ab_choice"] | null
          permanent_choice?: Database["public"]["Enums"]["abe_choice"] | null
          permanent_reason?: string | null
          submission_id: string
          ticket_a_observation?: string | null
          ticket_b_observation?: string | null
          updated_at?: string
        }
        Update: {
          clearer_choice?: Database["public"]["Enums"]["ab_choice"] | null
          comparison_reason?: string | null
          created_at?: string
          fairer_choice?: Database["public"]["Enums"]["ab_choice"] | null
          id?: string
          pay_choice?: Database["public"]["Enums"]["ab_choice"] | null
          permanent_choice?: Database["public"]["Enums"]["abe_choice"] | null
          permanent_reason?: string | null
          submission_id?: string
          ticket_a_observation?: string | null
          ticket_b_observation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ex1_activation_fee_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ex2_card_sort: {
        Row: {
          confirmed_at: string | null
          created_at: string
          id: string
          ordered_items: Json
          submission_id: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          ordered_items?: Json
          submission_id: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          ordered_items?: Json
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ex2_card_sort_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ex3_photo_grouping: {
        Row: {
          created_at: string
          favorite_photo_id: string | null
          favorite_reason: string | null
          group_assignments: Json
          group_details: Json
          id: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          favorite_photo_id?: string | null
          favorite_reason?: string | null
          group_assignments?: Json
          group_details?: Json
          id?: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          favorite_photo_id?: string | null
          favorite_reason?: string | null
          group_assignments?: Json
          group_details?: Json
          id?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ex3_photo_grouping_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submissions: {
        Row: {
          abandoned_at: string | null
          alias: string
          completed_at: string | null
          created_at: string
          edad_rango: string
          exercise_code: Database["public"]["Enums"]["exercise_code"]
          focus_group: string | null
          frecuencia_carga: string
          id: string
          meses_en_vemo: string
          segmento: Database["public"]["Enums"]["segment_code"]
          session_label: string
          started_at: string
          status: Database["public"]["Enums"]["submission_status"]
          tipo_vehiculo: string
          updated_at: string
          uso_principal: string
        }
        Insert: {
          abandoned_at?: string | null
          alias: string
          completed_at?: string | null
          created_at?: string
          edad_rango: string
          exercise_code: Database["public"]["Enums"]["exercise_code"]
          focus_group?: string | null
          frecuencia_carga: string
          id?: string
          meses_en_vemo: string
          segmento: Database["public"]["Enums"]["segment_code"]
          session_label: string
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          tipo_vehiculo: string
          updated_at?: string
          uso_principal: string
        }
        Update: {
          abandoned_at?: string | null
          alias?: string
          completed_at?: string | null
          created_at?: string
          edad_rango?: string
          exercise_code?: Database["public"]["Enums"]["exercise_code"]
          focus_group?: string | null
          frecuencia_carga?: string
          id?: string
          meses_en_vemo?: string
          segmento?: Database["public"]["Enums"]["segment_code"]
          session_label?: string
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          tipo_vehiculo?: string
          updated_at?: string
          uso_principal?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ab_choice: "A" | "B"
      abe_choice: "A" | "B" | "equal"
      exercise_code: "ticket_ab" | "card_sort" | "photos"
      segment_code: "ride_hailing" | "b2c"
      submission_status: "started" | "in_progress" | "completed" | "abandoned"
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
      ab_choice: ["A", "B"],
      abe_choice: ["A", "B", "equal"],
      exercise_code: ["ticket_ab", "card_sort", "photos"],
      segment_code: ["ride_hailing", "b2c"],
      submission_status: ["started", "in_progress", "completed", "abandoned"],
    },
  },
} as const
