import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { checkExpenseAgainstPolicies } from "@/hooks/useExpensePolicies";
import { useCompany } from "./useCompany";

export type Expense = Tables<"expenses"> & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  expense_categories?: { name: string } | null;
};
export type ExpenseInsert = TablesInsert<"expenses">;

export type ExpenseStatus = "pending" | "approved" | "rejected";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      // First get expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(`
          *,
          expense_categories:category_id(name)
        `)
        .order("created_at", { ascending: false });

      if (expensesError) throw expensesError;

      // Get unique creator IDs
      const creatorIds = [...new Set(expensesData.map(e => e.created_by).filter(Boolean))];
      
      // Fetch profiles for all creators
      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", creatorIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
        }
      }

      // Merge profiles into expenses
      const expenses = expensesData.map(expense => ({
        ...expense,
        profiles: expense.created_by ? profilesMap[expense.created_by] || null : null,
      }));

      return expenses as Expense[];
    },
  });
}

export function useExpenseStats() {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ["expense-stats", company?.id],
    queryFn: async () => {
      if (!company?.id) {
        return { totalAmount: 0, approvedAmount: 0, pendingAmount: 0, totalTransactions: 0 };
      }

      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("id, amount, status, created_at, expense_date, notes")
        .eq("company_id", company.id);

      if (error) throw error;

      const dedupedExpenses = (() => {
        const rows = expenses || [];
        const seenStatementTxIds = new Set<string>();
        const seenExpenseIds = new Set<string>();
        const deduped: typeof rows = [];

        for (const exp of rows) {
          const notes = typeof exp.notes === "string" ? exp.notes : "";
          const match = notes.match(/\[STMT_TX_([^\]]+)\]/);

          if (match && match[1]) {
            const txId = match[1];
            if (!seenStatementTxIds.has(txId)) {
              seenStatementTxIds.add(txId);
              deduped.push(exp);
            }
          } else if (!seenExpenseIds.has(exp.id)) {
            seenExpenseIds.add(exp.id);
            deduped.push(exp);
          }
        }

        return deduped;
      })();

      const totalAmount = dedupedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const approvedAmount = dedupedExpenses
        ?.filter((exp) => exp.status === "approved")
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const pendingAmount = dedupedExpenses
        ?.filter((exp) => exp.status === "pending")
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const totalTransactions = dedupedExpenses.length;

      return { totalAmount, approvedAmount, pendingAmount, totalTransactions };
    },
    enabled: !!company?.id,
  });
}

export function useExpenseCategories() {
  const { data: company } = useCompany();
  
  return useQuery({
    queryKey: ["expense-categories", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("company_id", company.id)
        .order("name");

      if (error) throw error;
      
      // Remove duplicates by name (keep first occurrence, case-insensitive)
      const uniqueCategories = Array.from(
        new Map(data?.map(cat => [cat.name.toLowerCase(), cat]) || []).values()
      );
      
      // Ensure "Other" category exists
      const hasOther = uniqueCategories.some(cat => cat.name.toLowerCase() === "other");
      if (!hasOther && data && data.length > 0) {
        // Create "Other" category if it doesn't exist
        try {
          const { data: otherCategory } = await supabase
            .from("expense_categories")
            .insert({
              company_id: company.id,
              name: "Other",
              description: "Custom category",
            })
            .select()
            .single();
          
          if (otherCategory) {
            uniqueCategories.push(otherCategory);
          }
        } catch (insertError) {
          // If insert fails (e.g., duplicate), try to fetch it
          const { data: existingOther } = await supabase
            .from("expense_categories")
            .select("*")
            .eq("company_id", company.id)
            .ilike("name", "other")
            .single();
          
          if (existingOther) {
            uniqueCategories.push(existingOther);
          }
        }
      }
      
      return uniqueCategories;
    },
    enabled: !!company?.id,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!company?.id) throw new Error("Company not found");

      // Check if category already exists
      const { data: existing } = await supabase
        .from("expense_categories")
        .select("id")
        .eq("company_id", company.id)
        .ilike("name", name.trim())
        .single();

      if (existing) {
        // Category already exists, return it
        return existing;
      }

      // Create new category
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          company_id: company.id,
          name: name.trim(),
          description: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check expense against policies before creating
      const violations = await checkExpenseAgainstPolicies({
        amount: Number(expense.amount),
        category_id: expense.category_id,
        expense_date: expense.expense_date || new Date().toISOString().split("T")[0],
      });

      // Check if any policy has auto_reject action
      const autoRejectViolation = violations.find(v => v.policy.action === "auto_reject");
      if (autoRejectViolation) {
        throw new Error(`Expense rejected by policy: ${autoRejectViolation.violationDetails}`);
      }

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expense,
          created_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Create policy violations for any flagged policies
      for (const violation of violations) {
        await supabase.from("expense_policy_violations").insert({
          expense_id: data.id,
          policy_id: violation.policy.id,
          violation_details: violation.violationDetails,
        });
      }

      // Send notification to finance managers if there are violations
      if (violations.length > 0) {
        supabase.functions.invoke("send-policy-violation-notification", {
          body: {
            expenseId: data.id,
            violations: violations.map(v => ({
              policyName: v.policy.name,
              policyType: v.policy.policy_type,
              violationDetails: v.violationDetails,
              action: v.policy.action,
            })),
          },
        }).catch((err) => console.error("Failed to send policy violation notification:", err));
      }

      return { expense: data, violations };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["policy-violations"] });
      
      if (result.violations.length > 0) {
        toast({
          title: "Expense submitted with policy flags",
          description: `Your expense has been submitted but flagged for ${result.violations.length} policy ${result.violations.length === 1 ? "violation" : "violations"}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Expense submitted",
          description: "Your expense has been submitted for approval",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      expense,
    }: {
      id: string;
      expense: Partial<Expense>;
    }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(expense)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast({
        title: "Expense updated",
        description: "The expense has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for unresolved policy violations
      const { data: violations, error: violationsError } = await supabase
        .from("expense_policy_violations")
        .select("id, resolved")
        .eq("expense_id", id)
        .eq("resolved", false);

      if (violationsError) throw violationsError;

      if (violations && violations.length > 0) {
        throw new Error(`Cannot approve: ${violations.length} unresolved policy violation${violations.length === 1 ? "" : "s"}. Please resolve all violations first.`);
      }

      const { data, error } = await supabase
        .from("expenses")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Send email notification (fire and forget)
      supabase.functions.invoke("send-expense-notification", {
        body: { expenseId: id, action: "approved" },
      }).catch((err) => console.error("Failed to send approval notification:", err));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast({
        title: "Expense approved",
        description: "The expense has been approved and the submitter notified",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("expenses")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Send email notification (fire and forget)
      supabase.functions.invoke("send-expense-notification", {
        body: { expenseId: id, action: "rejected", notes },
      }).catch((err) => console.error("Failed to send rejection notification:", err));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast({
        title: "Expense rejected",
        description: "The expense has been rejected and the submitter notified",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast({
        title: "Expense deleted",
        description: "The expense has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
