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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          tax_id: string | null
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          email: string
          employee_number: string | null
          full_name: string
          hire_date: string | null
          id: string
          location: string | null
          phone: string | null
          position: string | null
          salary: number | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          employee_number?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_number?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          department: string | null
          description: string
          employee_id: string | null
          expense_date: string
          id: string
          notes: string | null
          receipt_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description: string
          employee_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description?: string
          employee_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_date: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          allowances: number | null
          basic_salary: number
          company_id: string | null
          created_at: string
          created_by: string | null
          deductions: number | null
          employee_id: string
          id: string
          net_pay: number
          notes: string | null
          pay_date: string | null
          period_end: string
          period_start: string
          status: string | null
          updated_at: string
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_id: string
          id?: string
          net_pay: number
          notes?: string | null
          pay_date?: string | null
          period_end: string
          period_start: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_id?: string
          id?: string
          net_pay?: number
          notes?: string | null
          pay_date?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          category: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          file_url: string | null
          id: string
          linked_expense_id: string | null
          linked_invoice_id: string | null
          receipt_date: string
          receipt_number: string
          status: string | null
          tags: string[] | null
          updated_at: string
          vendor: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          linked_expense_id?: string | null
          linked_invoice_id?: string | null
          receipt_date?: string
          receipt_number: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          linked_expense_id?: string | null
          linked_invoice_id?: string | null
          receipt_date?: string
          receipt_number?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_finance_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "finance_manager"
        | "accountant"
        | "hr"
        | "employee"
        | "auditor"
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
      app_role: [
        "super_admin",
        "admin",
        "finance_manager",
        "accountant",
        "hr",
        "employee",
        "auditor",
      ],
    },
  },
} as const
