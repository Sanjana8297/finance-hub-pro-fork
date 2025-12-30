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
      anomaly_detection_settings: {
        Row: {
          approval_threshold_percent: number
          company_id: string | null
          created_at: string
          duplicate_window_hours: number
          high_amount_threshold_percent: number
          id: string
          is_active: boolean
          rapid_succession_minutes: number
          round_amount_threshold: number
          updated_at: string
          updated_by: string | null
          weekend_detection_enabled: boolean
        }
        Insert: {
          approval_threshold_percent?: number
          company_id?: string | null
          created_at?: string
          duplicate_window_hours?: number
          high_amount_threshold_percent?: number
          id?: string
          is_active?: boolean
          rapid_succession_minutes?: number
          round_amount_threshold?: number
          updated_at?: string
          updated_by?: string | null
          weekend_detection_enabled?: boolean
        }
        Update: {
          approval_threshold_percent?: number
          company_id?: string | null
          created_at?: string
          duplicate_window_hours?: number
          high_amount_threshold_percent?: number
          id?: string
          is_active?: boolean
          rapid_succession_minutes?: number
          round_amount_threshold?: number
          updated_at?: string
          updated_by?: string | null
          weekend_detection_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_detection_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_reviews: {
        Row: {
          anomaly_type: string
          company_id: string | null
          created_at: string
          expense_id: string
          id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          anomaly_type: string
          company_id?: string | null
          created_at?: string
          expense_id: string
          id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          anomaly_type?: string
          company_id?: string | null
          created_at?: string
          expense_id?: string
          id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomaly_reviews_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_chain_levels: {
        Row: {
          chain_id: string
          created_at: string
          id: string
          level_order: number
          required_approvers: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          chain_id: string
          created_at?: string
          id?: string
          level_order: number
          required_approvers?: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          chain_id?: string
          created_at?: string
          id?: string
          level_order?: number
          required_approvers?: number
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "approval_chain_levels_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "approval_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_chains: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          max_amount: number | null
          min_amount: number
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_chains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      department_budgets: {
        Row: {
          alert_threshold: number
          company_id: string | null
          created_at: string
          created_by: string | null
          department: string
          id: string
          is_active: boolean
          monthly_limit: number
          updated_at: string
        }
        Insert: {
          alert_threshold?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          id?: string
          is_active?: boolean
          monthly_limit: number
          updated_at?: string
        }
        Update: {
          alert_threshold?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          id?: string
          is_active?: boolean
          monthly_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      expense_approval_actions: {
        Row: {
          action: string
          approved_by: string
          comments: string | null
          created_at: string
          expense_approval_id: string
          id: string
          level_order: number
        }
        Insert: {
          action: string
          approved_by: string
          comments?: string | null
          created_at?: string
          expense_approval_id: string
          id?: string
          level_order: number
        }
        Update: {
          action?: string
          approved_by?: string
          comments?: string | null
          created_at?: string
          expense_approval_id?: string
          id?: string
          level_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_approval_actions_expense_approval_id_fkey"
            columns: ["expense_approval_id"]
            isOneToOne: false
            referencedRelation: "expense_approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_approvals: {
        Row: {
          chain_id: string | null
          created_at: string
          current_level: number
          expense_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          chain_id?: string | null
          created_at?: string
          current_level?: number
          expense_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          chain_id?: string | null
          created_at?: string
          current_level?: number
          expense_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_approvals_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "approval_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_approvals_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
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
      expense_delegations: {
        Row: {
          company_id: string | null
          created_at: string
          delegate_id: string
          delegator_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          delegate_id: string
          delegator_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          delegate_id?: string
          delegator_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_delegations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_policies: {
        Row: {
          action: string
          category_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          policy_type: string
          threshold_amount: number | null
          updated_at: string
        }
        Insert: {
          action?: string
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          policy_type: string
          threshold_amount?: number | null
          updated_at?: string
        }
        Update: {
          action?: string
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          policy_type?: string
          threshold_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_policies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_policy_violations: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          policy_id: string
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          violation_details: string | null
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          policy_id: string
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          violation_details?: string | null
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          policy_id?: string
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          violation_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_policy_violations_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_policy_violations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "expense_policies"
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
      notifications: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          message: string | null
          metadata: Json | null
          recipient_email: string | null
          recipient_name: string | null
          status: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
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
          verification_notes: string | null
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
          verification_notes?: string | null
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
          verification_notes?: string | null
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
      recurring_expenses: {
        Row: {
          amount: number
          auto_submit: boolean
          category_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          department: string | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_generated_date: string | null
          next_due_date: string
          notes: string | null
          start_date: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          auto_submit?: boolean
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          next_due_date: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          auto_submit?: boolean
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          next_due_date?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_company_id_fkey"
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
      has_delegated_approval_authority: {
        Args: { _user_id: string }
        Returns: boolean
      }
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
