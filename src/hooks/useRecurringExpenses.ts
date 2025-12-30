import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addWeeks, addMonths, addYears, format, isBefore, startOfDay } from "date-fns";

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringExpense {
  id: string;
  company_id: string | null;
  description: string;
  amount: number;
  currency: string;
  category_id: string | null;
  department: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_due_date: string;
  end_date: string | null;
  is_active: boolean;
  auto_submit: boolean;
  vendor: string | null;
  notes: string | null;
  last_generated_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expense_categories?: { name: string } | null;
}

export interface RecurringExpenseInsert {
  description: string;
  amount: number;
  currency?: string;
  category_id?: string | null;
  department?: string | null;
  frequency: RecurringFrequency;
  start_date?: string;
  next_due_date: string;
  end_date?: string | null;
  is_active?: boolean;
  auto_submit?: boolean;
  vendor?: string | null;
  notes?: string | null;
}

export function calculateNextDueDate(
  currentDueDate: Date,
  frequency: RecurringFrequency
): Date {
  switch (frequency) {
    case "weekly":
      return addWeeks(currentDueDate, 1);
    case "biweekly":
      return addWeeks(currentDueDate, 2);
    case "monthly":
      return addMonths(currentDueDate, 1);
    case "quarterly":
      return addMonths(currentDueDate, 3);
    case "yearly":
      return addYears(currentDueDate, 1);
    default:
      return addMonths(currentDueDate, 1);
  }
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select(`
          *,
          expense_categories (name)
        `)
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data as RecurringExpense[];
    },
  });
}

export function useDueRecurringExpenses() {
  return useQuery({
    queryKey: ["due-recurring-expenses"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select(`
          *,
          expense_categories (name)
        `)
        .eq("is_active", true)
        .lte("next_due_date", today)
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data as RecurringExpense[];
    },
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: RecurringExpenseInsert) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      const { data, error } = await supabase
        .from("recurring_expenses")
        .insert({
          ...expense,
          company_id: profile?.company_id,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["due-recurring-expenses"] });
      toast.success("Recurring expense created");
    },
    onError: () => {
      toast.error("Failed to create recurring expense");
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<RecurringExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["due-recurring-expenses"] });
      toast.success("Recurring expense updated");
    },
    onError: () => {
      toast.error("Failed to update recurring expense");
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurring_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["due-recurring-expenses"] });
      toast.success("Recurring expense deleted");
    },
    onError: () => {
      toast.error("Failed to delete recurring expense");
    },
  });
}

export function useGenerateExpenseFromRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recurring: RecurringExpense) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      // Create the expense
      const { error: expenseError } = await supabase.from("expenses").insert({
        description: recurring.description,
        amount: recurring.amount,
        currency: recurring.currency,
        category_id: recurring.category_id,
        department: recurring.department,
        expense_date: recurring.next_due_date,
        notes: `Auto-generated from recurring: ${recurring.vendor || recurring.description}`,
        status: recurring.auto_submit ? "pending" : "pending",
        company_id: profile?.company_id,
        created_by: userData.user.id,
      });

      if (expenseError) throw expenseError;

      // Update the recurring expense with next due date
      const nextDue = calculateNextDueDate(
        new Date(recurring.next_due_date),
        recurring.frequency
      );

      // Check if we've passed the end date
      const isEnded = recurring.end_date && isBefore(nextDue, new Date(recurring.end_date)) === false;

      const { error: updateError } = await supabase
        .from("recurring_expenses")
        .update({
          next_due_date: format(nextDue, "yyyy-MM-dd"),
          last_generated_date: recurring.next_due_date,
          is_active: !isEnded,
        })
        .eq("id", recurring.id);

      if (updateError) throw updateError;

      return { generated: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["due-recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense generated from recurring");
    },
    onError: () => {
      toast.error("Failed to generate expense");
    },
  });
}
