export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          role: Database["public"]["Enums"]["admin_role_enum"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role_enum"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role_enum"] | null
          updated_at?: string
        }
        Relationships: []
      }
      attendee_feedback: {
        Row: {
          event_id: string
          feedback_text: string | null
          id: string
          rating: number | null
          submitted_at: string
          ticket_purchase_id: string | null
        }
        Insert: {
          event_id: string
          feedback_text?: string | null
          id?: string
          rating?: number | null
          submitted_at?: string
          ticket_purchase_id?: string | null
        }
        Update: {
          event_id?: string
          feedback_text?: string | null
          id?: string
          rating?: number | null
          submitted_at?: string
          ticket_purchase_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendee_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_feedback_ticket_purchase_id_fkey"
            columns: ["ticket_purchase_id"]
            isOneToOne: false
            referencedRelation: "ticket_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budgets: {
        Row: {
          budgeted_amount: number
          category: string
          created_at: string
          currency: string | null
          event_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          budgeted_amount?: number
          category: string
          created_at?: string
          currency?: string | null
          event_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      event_custom_fields: {
        Row: {
          created_at: string
          event_id: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_order: number
          field_type: string
          id: string
          is_required: boolean
        }
        Insert: {
          created_at?: string
          event_id: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_order?: number
          field_type: string
          id?: string
          is_required?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_custom_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendees: number | null
          banner_image: string | null
          capacity: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_published: boolean | null
          location: string
          name: string
          price: number | null
          public_link: string | null
          revenue: number | null
          status: Database["public"]["Enums"]["event_status_enum"] | null
          tickets_sold: number | null
          time_end: string | null
          time_start: string
          updated_at: string
        }
        Insert: {
          attendees?: number | null
          banner_image?: string | null
          capacity: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          location: string
          name: string
          price?: number | null
          public_link?: string | null
          revenue?: number | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          tickets_sold?: number | null
          time_end?: string | null
          time_start: string
          updated_at?: string
        }
        Update: {
          attendees?: number | null
          banner_image?: string | null
          capacity?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          location?: string
          name?: string
          price?: number | null
          public_link?: string | null
          revenue?: number | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          tickets_sold?: number | null
          time_end?: string | null
          time_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_tracking: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string
          event_id: string
          id: string
          paid_at: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description: string
          event_id: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string
          event_id?: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_tracking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_tracking_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          event_id: string | null
          external_transaction_id: string | null
          id: string
          processed_at: string
          ticket_purchase_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          event_id?: string | null
          external_transaction_id?: string | null
          id?: string
          processed_at?: string
          ticket_purchase_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          event_id?: string | null
          external_transaction_id?: string | null
          id?: string
          processed_at?: string
          ticket_purchase_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_ticket_purchase_id_fkey"
            columns: ["ticket_purchase_id"]
            isOneToOne: false
            referencedRelation: "ticket_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      ticket_purchases: {
        Row: {
          amount_paid: number
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          chapa_checkout_url: string | null
          chapa_transaction_id: string | null
          chapa_tx_ref: string | null
          check_in_time: string | null
          checked_in: boolean | null
          created_at: string
          custom_fields: Json | null
          event_id: string
          first_name: string | null
          id: string
          last_name: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          purchase_date: string
          raw_chapa_data: Json | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          tickets_quantity: number
          updated_at: string
        }
        Insert: {
          amount_paid: number
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          chapa_checkout_url?: string | null
          chapa_transaction_id?: string | null
          chapa_tx_ref?: string | null
          check_in_time?: string | null
          checked_in?: boolean | null
          created_at?: string
          custom_fields?: Json | null
          event_id: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          purchase_date?: string
          raw_chapa_data?: Json | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          tickets_quantity?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          chapa_checkout_url?: string | null
          chapa_transaction_id?: string | null
          chapa_tx_ref?: string | null
          check_in_time?: string | null
          checked_in?: boolean | null
          created_at?: string
          custom_fields?: Json | null
          event_id?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          purchase_date?: string
          raw_chapa_data?: Json | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          tickets_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_kpis: {
        Row: {
          monthly_purchases: number | null
          total_events: number | null
          total_purchases: number | null
          total_revenue: number | null
          total_tickets_sold: number | null
          upcoming_events: number | null
          weekly_purchases: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      refresh_dashboard_kpis: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      admin_role_enum: "super_admin" | "admin" | "moderator" | "viewer"
      app_role: "admin" | "moderator" | "viewer"
      event_status_enum: "Draft" | "Active" | "Cancelled" | "Completed"
      payment_method_enum: "chapa" | "bank_transfer" | "cash" | "mobile_money"
      payment_status_enum:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
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
      admin_role_enum: ["super_admin", "admin", "moderator", "viewer"],
      app_role: ["admin", "moderator", "viewer"],
      event_status_enum: ["Draft", "Active", "Cancelled", "Completed"],
      payment_method_enum: ["chapa", "bank_transfer", "cash", "mobile_money"],
      payment_status_enum: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
    },
  },
} as const
