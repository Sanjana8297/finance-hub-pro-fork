import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ExpensePolicy = {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  policy_type: "threshold" | "category_restriction" | "daily_limit" | "monthly_limit";
  threshold_amount: number | null;
  category_id: string | null;
  action: "flag" | "require_approval" | "auto_reject";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  expense_categories?: { name: string } | null;
};

export type ExpensePolicyInsert = {
  name: string;
  description?: string | null;
  policy_type: "threshold" | "category_restriction" | "daily_limit" | "monthly_limit";
  threshold_amount?: number | null;
  category_id?: string | null;
  action?: "flag" | "require_approval" | "auto_reject";
  is_active?: boolean;
};

export type PolicyViolation = {
  id: string;
  expense_id: string;
  policy_id: string;
  violation_details: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  expense_policies?: ExpensePolicy;
};

export function useExpensePolicies() {
  return useQuery({
    queryKey: ["expense-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_policies")
        .select(`
          *,
          expense_categories:category_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ExpensePolicy[];
    },
  });
}

export function useActivePolicies() {
  return useQuery({
    queryKey: ["expense-policies-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_policies")
        .select(`
          *,
          expense_categories:category_id(name)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as ExpensePolicy[];
    },
  });
}

export function usePolicyViolations(expenseId?: string) {
  return useQuery({
    queryKey: ["policy-violations", expenseId],
    queryFn: async () => {
      let query = supabase
        .from("expense_policy_violations")
        .select(`
          *,
          expense_policies:policy_id(*)
        `)
        .order("created_at", { ascending: false });

      if (expenseId) {
        query = query.eq("expense_id", expenseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PolicyViolation[];
    },
    enabled: !expenseId || !!expenseId,
  });
}

export function useCreateExpensePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: ExpensePolicyInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("expense_policies")
        .insert({
          ...policy,
          created_by: user.id,
          company_id: profile?.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-policies"] });
      queryClient.invalidateQueries({ queryKey: ["expense-policies-active"] });
      toast({
        title: "Policy created",
        description: "The expense policy has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExpensePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, policy }: { id: string; policy: Partial<ExpensePolicyInsert> }) => {
      const { data, error } = await supabase
        .from("expense_policies")
        .update(policy)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-policies"] });
      queryClient.invalidateQueries({ queryKey: ["expense-policies-active"] });
      toast({
        title: "Policy updated",
        description: "The expense policy has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExpensePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_policies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-policies"] });
      queryClient.invalidateQueries({ queryKey: ["expense-policies-active"] });
      toast({
        title: "Policy deleted",
        description: "The expense policy has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreatePolicyViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (violation: { expense_id: string; policy_id: string; violation_details?: string }) => {
      const { data, error } = await supabase
        .from("expense_policy_violations")
        .insert(violation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-violations"] });
    },
  });
}

export function useResolvePolicyViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("expense_policy_violations")
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-violations"] });
      toast({
        title: "Violation resolved",
        description: "The policy violation has been marked as resolved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resolve violation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Function to check an expense against active policies
export async function checkExpenseAgainstPolicies(
  expense: { amount: number; category_id?: string | null; expense_date: string }
): Promise<{ policy: ExpensePolicy; violationDetails: string }[]> {
  const { data: policies, error } = await supabase
    .from("expense_policies")
    .select(`
      *,
      expense_categories:category_id(name)
    `)
    .eq("is_active", true);

  if (error || !policies) return [];

  const violations: { policy: ExpensePolicy; violationDetails: string }[] = [];

  for (const policy of policies as ExpensePolicy[]) {
    switch (policy.policy_type) {
      case "threshold":
        if (policy.threshold_amount && expense.amount > policy.threshold_amount) {
          violations.push({
            policy,
            violationDetails: `Expense amount $${expense.amount.toLocaleString()} exceeds threshold of $${policy.threshold_amount.toLocaleString()}`,
          });
        }
        break;

      case "category_restriction":
        if (policy.category_id && expense.category_id === policy.category_id) {
          violations.push({
            policy,
            violationDetails: `Expense is in restricted category: ${policy.expense_categories?.name || "Unknown"}`,
          });
        }
        break;

      case "daily_limit":
        if (policy.threshold_amount) {
          // Get sum of expenses for the same day
          const { data: dailyExpenses } = await supabase
            .from("expenses")
            .select("amount")
            .eq("expense_date", expense.expense_date);
          
          const dailyTotal = (dailyExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0) + expense.amount;
          
          if (dailyTotal > policy.threshold_amount) {
            violations.push({
              policy,
              violationDetails: `Daily total $${dailyTotal.toLocaleString()} exceeds daily limit of $${policy.threshold_amount.toLocaleString()}`,
            });
          }
        }
        break;

      case "monthly_limit":
        if (policy.threshold_amount) {
          // Get sum of expenses for the same month
          const expenseDate = new Date(expense.expense_date);
          const startOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1).toISOString().split("T")[0];
          const endOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0).toISOString().split("T")[0];

          const { data: monthlyExpenses } = await supabase
            .from("expenses")
            .select("amount")
            .gte("expense_date", startOfMonth)
            .lte("expense_date", endOfMonth);
          
          const monthlyTotal = (monthlyExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0) + expense.amount;
          
          if (monthlyTotal > policy.threshold_amount) {
            violations.push({
              policy,
              violationDetails: `Monthly total $${monthlyTotal.toLocaleString()} exceeds monthly limit of $${policy.threshold_amount.toLocaleString()}`,
            });
          }
        }
        break;
    }
  }

  return violations;
}
