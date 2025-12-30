import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface ApprovalChain {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalChainLevel {
  id: string;
  chain_id: string;
  level_order: number;
  role: AppRole;
  required_approvers: number;
  created_at: string;
}

export interface ApprovalChainWithLevels extends ApprovalChain {
  levels: ApprovalChainLevel[];
}

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  chain_id: string | null;
  current_level: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseApprovalAction {
  id: string;
  expense_approval_id: string;
  level_order: number;
  action: string;
  approved_by: string;
  comments: string | null;
  created_at: string;
}

// Fetch all approval chains with their levels
export function useApprovalChains() {
  return useQuery({
    queryKey: ["approval-chains"],
    queryFn: async () => {
      const { data: chains, error: chainsError } = await supabase
        .from("approval_chains")
        .select("*")
        .order("min_amount", { ascending: true });

      if (chainsError) throw chainsError;

      const { data: levels, error: levelsError } = await supabase
        .from("approval_chain_levels")
        .select("*")
        .order("level_order", { ascending: true });

      if (levelsError) throw levelsError;

      const chainsWithLevels: ApprovalChainWithLevels[] = (chains || []).map((chain) => ({
        ...chain,
        levels: (levels || []).filter((level) => level.chain_id === chain.id),
      }));

      return chainsWithLevels;
    },
  });
}

// Create a new approval chain
export function useCreateApprovalChain() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      min_amount: number;
      max_amount?: number;
      levels: { role: AppRole; required_approvers: number }[];
    }) => {
      // Get company_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id || "")
        .single();

      // Create the chain
      const { data: chain, error: chainError } = await supabase
        .from("approval_chains")
        .insert({
          name: data.name,
          description: data.description,
          min_amount: data.min_amount,
          max_amount: data.max_amount,
          company_id: profile?.company_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (chainError) throw chainError;

      // Create the levels
      if (data.levels.length > 0) {
        const levelsToInsert = data.levels.map((level, index) => ({
          chain_id: chain.id,
          level_order: index + 1,
          role: level.role,
          required_approvers: level.required_approvers,
        }));

        const { error: levelsError } = await supabase
          .from("approval_chain_levels")
          .insert(levelsToInsert);

        if (levelsError) throw levelsError;
      }

      return chain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-chains"] });
      toast({ title: "Approval chain created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create approval chain", description: error.message, variant: "destructive" });
    },
  });
}

// Update an approval chain
export function useUpdateApprovalChain() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      min_amount?: number;
      max_amount?: number | null;
      is_active?: boolean;
      levels?: { role: AppRole; required_approvers: number }[];
    }) => {
      const { id, levels, ...updateData } = data;

      // Update the chain
      const { error: chainError } = await supabase
        .from("approval_chains")
        .update(updateData)
        .eq("id", id);

      if (chainError) throw chainError;

      // Update levels if provided
      if (levels) {
        // Delete existing levels
        await supabase.from("approval_chain_levels").delete().eq("chain_id", id);

        // Insert new levels
        if (levels.length > 0) {
          const levelsToInsert = levels.map((level, index) => ({
            chain_id: id,
            level_order: index + 1,
            role: level.role,
            required_approvers: level.required_approvers,
          }));

          const { error: levelsError } = await supabase
            .from("approval_chain_levels")
            .insert(levelsToInsert);

          if (levelsError) throw levelsError;
        }
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-chains"] });
      toast({ title: "Approval chain updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update approval chain", description: error.message, variant: "destructive" });
    },
  });
}

// Delete an approval chain
export function useDeleteApprovalChain() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("approval_chains").delete().eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-chains"] });
      toast({ title: "Approval chain deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete approval chain", description: error.message, variant: "destructive" });
    },
  });
}

// Fetch expense approval status
export function useExpenseApproval(expenseId: string) {
  return useQuery({
    queryKey: ["expense-approval", expenseId],
    queryFn: async () => {
      const { data: approval, error: approvalError } = await supabase
        .from("expense_approvals")
        .select("*")
        .eq("expense_id", expenseId)
        .maybeSingle();

      if (approvalError) throw approvalError;
      if (!approval) return null;

      const { data: actions, error: actionsError } = await supabase
        .from("expense_approval_actions")
        .select("*")
        .eq("expense_approval_id", approval.id)
        .order("level_order", { ascending: true });

      if (actionsError) throw actionsError;

      return { ...approval, actions: actions || [] };
    },
    enabled: !!expenseId,
  });
}

// Submit expense for approval
export function useSubmitExpenseForApproval() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { expenseId: string; amount: number }) => {
      // Find matching approval chain based on amount
      const { data: chains, error: chainsError } = await supabase
        .from("approval_chains")
        .select("*")
        .eq("is_active", true)
        .lte("min_amount", data.amount)
        .order("min_amount", { ascending: false });

      if (chainsError) throw chainsError;

      // Find the chain that matches the amount range
      const matchingChain = chains?.find(
        (chain) => data.amount >= chain.min_amount && (!chain.max_amount || data.amount <= chain.max_amount)
      );

      if (!matchingChain) {
        // No approval chain needed, auto-approve
        const { error } = await supabase
          .from("expenses")
          .update({ status: "approved" })
          .eq("id", data.expenseId);
        if (error) throw error;
        return { autoApproved: true };
      }

      // Create expense approval record
      const { error: approvalError } = await supabase.from("expense_approvals").insert({
        expense_id: data.expenseId,
        chain_id: matchingChain.id,
        current_level: 1,
        status: "pending",
      });

      if (approvalError) throw approvalError;

      return { autoApproved: false, chainId: matchingChain.id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-approval"] });
      if (result.autoApproved) {
        toast({ title: "Expense auto-approved (no approval chain required)" });
      } else {
        toast({ title: "Expense submitted for approval" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit expense", description: error.message, variant: "destructive" });
    },
  });
}

// Approve or reject expense at current level
export function useApproveExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { expenseId: string; action: "approve" | "reject"; comments?: string }) => {
      // Get the current approval record
      const { data: approval, error: approvalError } = await supabase
        .from("expense_approvals")
        .select("*, approval_chains!inner(id)")
        .eq("expense_id", data.expenseId)
        .single();

      if (approvalError) throw approvalError;

      // Get chain levels
      const { data: levels, error: levelsError } = await supabase
        .from("approval_chain_levels")
        .select("*")
        .eq("chain_id", approval.chain_id)
        .order("level_order", { ascending: true });

      if (levelsError) throw levelsError;

      // Record the action
      const { error: actionError } = await supabase.from("expense_approval_actions").insert({
        expense_approval_id: approval.id,
        level_order: approval.current_level,
        action: data.action,
        approved_by: user?.id,
        comments: data.comments,
      });

      if (actionError) throw actionError;

      if (data.action === "reject") {
        // Reject the expense
        await supabase.from("expense_approvals").update({ status: "rejected" }).eq("id", approval.id);
        await supabase.from("expenses").update({ status: "rejected" }).eq("id", data.expenseId);
        return { finalStatus: "rejected" };
      }

      // Check if this is the last level
      const maxLevel = Math.max(...(levels?.map((l) => l.level_order) || [1]));

      if (approval.current_level >= maxLevel) {
        // Final approval
        await supabase.from("expense_approvals").update({ status: "approved" }).eq("id", approval.id);
        await supabase
          .from("expenses")
          .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
          .eq("id", data.expenseId);
        return { finalStatus: "approved" };
      } else {
        // Move to next level
        await supabase
          .from("expense_approvals")
          .update({ current_level: approval.current_level + 1 })
          .eq("id", approval.id);
        return { finalStatus: "pending", nextLevel: approval.current_level + 1 };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-approval"] });
      if (result.finalStatus === "approved") {
        toast({ title: "Expense fully approved" });
      } else if (result.finalStatus === "rejected") {
        toast({ title: "Expense rejected" });
      } else {
        toast({ title: `Expense approved at level ${result.nextLevel! - 1}, moving to level ${result.nextLevel}` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to process approval", description: error.message, variant: "destructive" });
    },
  });
}
