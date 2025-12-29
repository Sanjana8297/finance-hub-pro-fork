import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { checkExpenseAgainstPolicies } from "@/hooks/useExpensePolicies";

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
  return useQuery({
    queryKey: ["expense-stats"],
    queryFn: async () => {
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("id, amount, status, created_at");

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalAmount = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const approvedAmount = expenses
        ?.filter((exp) => exp.status === "approved")
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const pendingAmount = expenses
        ?.filter((exp) => exp.status === "pending")
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const thisMonthCount = expenses?.filter(
        (exp) => new Date(exp.created_at) >= startOfMonth
      ).length || 0;

      return { totalAmount, approvedAmount, pendingAmount, thisMonthCount };
    },
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
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
