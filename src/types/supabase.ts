export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          normalized_name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          normalized_name: string
          owner_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          normalized_name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          iso_code: string | null
          name: string
          name_ar: string | null
          normalized_name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          iso_code?: string | null
          name: string
          name_ar?: string | null
          normalized_name: string
          owner_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          iso_code?: string | null
          name?: string
          name_ar?: string | null
          normalized_name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_driver_id: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          latitude: number | null
          location_status: string | null
          longitude: number | null
          normalized_city: string | null
          note: string | null
          owner_id: string
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_driver_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          latitude?: number | null
          location_status?: string | null
          longitude?: number | null
          normalized_city?: string | null
          note?: string | null
          owner_id: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_driver_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_status?: string | null
          longitude?: number | null
          normalized_city?: string | null
          note?: string | null
          owner_id?: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_check_ins: {
        Row: {
          address: string | null
          attempts: number
          blocked_reason: string | null
          completed_at: string | null
          created_at: string
          date: string
          driver_id: string
          gps_accuracy: number | null
          latitude: number | null
          longitude: number | null
          odometer_km: number | null
          owner_id: string
          photo_storage_path: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          attempts?: number
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          date: string
          driver_id: string
          gps_accuracy?: number | null
          latitude?: number | null
          longitude?: number | null
          odometer_km?: number | null
          owner_id: string
          photo_storage_path?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          attempts?: number
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string
          driver_id?: string
          gps_accuracy?: number | null
          latitude?: number | null
          longitude?: number | null
          odometer_km?: number | null
          owner_id?: string
          photo_storage_path?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_check_ins_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_check_ins_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_completion_stats: {
        Row: {
          count: number
          date: string
          driver_id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          count?: number
          date: string
          driver_id: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          count?: number
          date?: string
          driver_id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_completion_stats_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_completion_stats_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          sort_order: number
          unit: string
        }
        Insert: {
          id: string
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          sort_order?: number
          unit: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_driver_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          id: string
          note: string | null
          ordered_at: string
          owner_id: string
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_driver_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          id: string
          note?: string | null
          ordered_at: string
          owner_id: string
          request_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          assigned_driver_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          ordered_at?: string
          owner_id?: string
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          default_unit: string
          emoji: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          normalized_name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_unit: string
          emoji?: string | null
          id: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          normalized_name: string
          owner_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_unit?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          normalized_name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          manager_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          manager_id?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          normalized_city: string | null
          normalized_country: string | null
          normalized_name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          normalized_city?: string | null
          normalized_country?: string | null
          normalized_name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          normalized_city?: string | null
          normalized_country?: string | null
          normalized_name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          language: string | null
          preferred_navigation_app: string | null
          share_include_address: boolean
          share_include_phone: boolean
          share_include_totals: boolean
          shop_name: string | null
          theme_mode: string | null
          updated_at: string
          whatsapp_selection_template: string | null
        }
        Insert: {
          created_at?: string
          id: string
          language?: string | null
          preferred_navigation_app?: string | null
          share_include_address?: boolean
          share_include_phone?: boolean
          share_include_totals?: boolean
          shop_name?: string | null
          theme_mode?: string | null
          updated_at?: string
          whatsapp_selection_template?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          preferred_navigation_app?: string | null
          share_include_address?: boolean
          share_include_phone?: boolean
          share_include_totals?: boolean
          shop_name?: string | null
          theme_mode?: string | null
          updated_at?: string
          whatsapp_selection_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_customer_driver: {
        Args: { p_customer_id: string; p_driver_id: string }
        Returns: undefined
      }
      create_order_atomic: {
        Args: {
          p_customer_id: string
          p_items: Json
          p_new_customer: Json
          p_order: Json
          p_order_id: string
        }
        Returns: undefined
      }
      fn_caller_manager_id: { Args: never; Returns: string }
      fn_caller_role: { Args: never; Returns: string }
      fn_is_assigned_driver_for: {
        Args: { p_assigned_driver_id: string; p_owner_id: string }
        Returns: boolean
      }
      get_active_user_count: { Args: never; Returns: number }
      record_checkin_attempt_failure: {
        Args: { p_date: string; p_driver_id: string; p_owner_id: string }
        Returns: undefined
      }
      record_driver_completion: {
        Args: { p_date: string; p_driver_id: string; p_owner_id: string }
        Returns: undefined
      }
      submit_checkin: {
        Args: {
          p_address: string
          p_date: string
          p_driver_id: string
          p_gps_accuracy: number
          p_latitude: number
          p_longitude: number
          p_odometer_km: number
          p_owner_id: string
          p_photo_storage_path: string
        }
        Returns: undefined
      }
      update_open_order_customer_and_items: {
        Args: {
          p_customer_id: string
          p_customer_patch: Json
          p_items: Json
          p_order_id: string
          p_order_patch: Json
        }
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
    Enums: {},
  },
} as const
