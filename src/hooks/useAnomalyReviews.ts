import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface AnomalyReview {
  id: string;
  expense_id: string;
  anomaly_type: string;
  severity: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  expenses?: {
    id: string;
    description: string;
    amount: number;
    expense_date: string;
    department: string | null;
    created_by: string | null;
  } | null;
}

// Fetch all anomaly reviews
export function useAnomalyReviews() {
  return useQuery({
    queryKey: ["anomaly-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomaly_reviews")
        .select(`
          *,
          expenses:expense_id (
            id,
            description,
            amount,
            expense_date,
            department,
            created_by
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnomalyReview[];
    },
  });
}

// Create anomaly review record
export function useCreateAnomalyReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      expense_id: string;
      anomaly_type: string;
      severity: string;
      company_id?: string;
    }) => {
      // Check if review already exists
      const { data: existing } = await supabase
        .from("anomaly_reviews")
        .select("id")
        .eq("expense_id", data.expense_id)
        .eq("anomaly_type", data.anomaly_type)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      const { data: review, error } = await supabase
        .from("anomaly_reviews")
        .insert({
          expense_id: data.expense_id,
          anomaly_type: data.anomaly_type,
          severity: data.severity,
          company_id: data.company_id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomaly-reviews"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create anomaly review", description: error.message, variant: "destructive" });
    },
  });
}

// Review/Dismiss anomaly
export function useReviewAnomaly() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      status: "reviewed" | "dismissed" | "escalated";
      resolution_notes?: string;
    }) => {
      const { error } = await supabase
        .from("anomaly_reviews")
        .update({
          status: data.status,
          resolution_notes: data.resolution_notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) throw error;

      // Log to audit
      await supabase.from("audit_logs").insert({
        action: `anomaly_${data.status}`,
        table_name: "anomaly_reviews",
        record_id: data.id,
        user_id: user?.id,
        new_value: {
          status: data.status,
          resolution_notes: data.resolution_notes,
        },
      });

      return { id: data.id, status: data.status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["anomaly-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["expense-anomalies"] });
      const statusLabel = result.status === "reviewed" ? "marked as reviewed" : 
                          result.status === "dismissed" ? "dismissed" : "escalated";
      toast({ title: `Anomaly ${statusLabel}` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update anomaly", description: error.message, variant: "destructive" });
    },
  });
}

// Bulk review anomalies
export function useBulkReviewAnomalies() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      ids: string[];
      status: "reviewed" | "dismissed";
      resolution_notes?: string;
    }) => {
      const { error } = await supabase
        .from("anomaly_reviews")
        .update({
          status: data.status,
          resolution_notes: data.resolution_notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .in("id", data.ids);

      if (error) throw error;

      // Log to audit
      for (const id of data.ids) {
        await supabase.from("audit_logs").insert({
          action: `bulk_anomaly_${data.status}`,
          table_name: "anomaly_reviews",
          record_id: id,
          user_id: user?.id,
          new_value: { status: data.status },
        });
      }

      return { count: data.ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["anomaly-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["expense-anomalies"] });
      toast({ title: `${result.count} anomalies updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update anomalies", description: error.message, variant: "destructive" });
    },
  });
}

// Get anomaly review stats
export function useAnomalyReviewStats() {
  return useQuery({
    queryKey: ["anomaly-review-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomaly_reviews")
        .select("status, severity");

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter((r) => r.status === "pending").length || 0,
        reviewed: data?.filter((r) => r.status === "reviewed").length || 0,
        dismissed: data?.filter((r) => r.status === "dismissed").length || 0,
        escalated: data?.filter((r) => r.status === "escalated").length || 0,
        highSeverity: data?.filter((r) => r.severity === "high" && r.status === "pending").length || 0,
      };

      return stats;
    },
  });
}
