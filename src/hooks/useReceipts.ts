import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Receipt = Tables<"receipts"> & { verification_notes?: string | null };
export type ReceiptInsert = TablesInsert<"receipts">;

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Receipt[];
    },
  });
}

export function useReceiptStats() {
  return useQuery({
    queryKey: ["receipt-stats"],
    queryFn: async () => {
      const { data: receipts, error } = await supabase
        .from("receipts")
        .select("id, amount, status, created_at");

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const total = receipts?.length || 0;
      const thisMonth = receipts?.filter(
        (r) => new Date(r.created_at) >= startOfMonth
      ).length || 0;
      const pending = receipts?.filter((r) => r.status === "pending").length || 0;
      const totalValue = receipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      return { total, thisMonth, pending, totalValue };
    },
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receipt: ReceiptInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("receipts")
        .insert({
          ...receipt,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["receipt-stats"] });
      toast({
        title: "Receipt created",
        description: "Your receipt has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create receipt",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVerifyReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "verified" | "rejected";
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("receipts")
        .update({
          status,
          verification_notes: notes || null,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["receipt-stats"] });
      toast({
        title: variables.status === "verified" ? "Receipt approved" : "Receipt rejected",
        description: `The receipt has been ${variables.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receipts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["receipt-stats"] });
      toast({
        title: "Receipt deleted",
        description: "The receipt has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete receipt",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
