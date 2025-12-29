import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ExpenseDelegation {
  id: string;
  company_id: string | null;
  delegator_id: string;
  delegate_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  delegator?: { full_name: string | null; email: string | null } | null;
  delegate?: { full_name: string | null; email: string | null } | null;
}

export interface CreateDelegationInput {
  delegate_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export function useExpenseDelegations() {
  return useQuery({
    queryKey: ["expense-delegations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_delegations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for delegators and delegates
      const userIds = [...new Set([
        ...data.map(d => d.delegator_id),
        ...data.map(d => d.delegate_id)
      ])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = { full_name: p.full_name, email: p.email };
        return acc;
      }, {} as Record<string, { full_name: string | null; email: string | null }>);

      return data.map(d => ({
        ...d,
        delegator: profileMap[d.delegator_id] || null,
        delegate: profileMap[d.delegate_id] || null,
      })) as ExpenseDelegation[];
    },
  });
}

export function useActiveDelegations() {
  return useQuery({
    queryKey: ["active-delegations"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("expense_delegations")
        .select("*")
        .eq("status", "active")
        .lte("start_date", today)
        .gte("end_date", today);

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDelegationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("expense_delegations")
        .insert({
          delegator_id: user.id,
          delegate_id: input.delegate_id,
          start_date: input.start_date,
          end_date: input.end_date,
          reason: input.reason || null,
          company_id: profile?.company_id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-delegations"] });
      queryClient.invalidateQueries({ queryKey: ["active-delegations"] });
      toast({
        title: "Delegation created",
        description: "Approval authority has been delegated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create delegation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("expense_delegations")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-delegations"] });
      queryClient.invalidateQueries({ queryKey: ["active-delegations"] });
      toast({
        title: "Delegation cancelled",
        description: "The delegation has been cancelled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel delegation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_delegations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-delegations"] });
      queryClient.invalidateQueries({ queryKey: ["active-delegations"] });
      toast({
        title: "Delegation deleted",
        description: "The delegation has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete delegation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useHasDelegatedAuthority() {
  return useQuery({
    queryKey: ["has-delegated-authority"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .rpc("has_delegated_approval_authority", { _user_id: user.id });

      if (error) {
        console.error("Error checking delegated authority:", error);
        return false;
      }
      return data as boolean;
    },
  });
}
