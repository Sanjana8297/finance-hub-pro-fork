import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface AnomalyDetectionSettings {
  id: string;
  company_id: string | null;
  high_amount_threshold_percent: number;
  duplicate_window_hours: number;
  rapid_succession_minutes: number;
  approval_threshold_percent: number;
  round_amount_threshold: number;
  weekend_detection_enabled: boolean;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Default settings when none exist
const DEFAULT_SETTINGS: Omit<AnomalyDetectionSettings, "id" | "company_id" | "updated_by" | "created_at" | "updated_at"> = {
  high_amount_threshold_percent: 200,
  duplicate_window_hours: 24,
  rapid_succession_minutes: 30,
  approval_threshold_percent: 90,
  round_amount_threshold: 100,
  weekend_detection_enabled: true,
  is_active: true,
};

// Fetch anomaly detection settings
export function useAnomalySettings() {
  return useQuery({
    queryKey: ["anomaly-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomaly_detection_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      // Return existing settings or defaults
      if (data) {
        return data as AnomalyDetectionSettings;
      }

      return {
        ...DEFAULT_SETTINGS,
        id: "",
        company_id: null,
        updated_by: null,
        created_at: "",
        updated_at: "",
      } as AnomalyDetectionSettings;
    },
  });
}

// Update or create anomaly settings
export function useUpdateAnomalySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<Omit<AnomalyDetectionSettings, "id" | "company_id" | "created_at" | "updated_at">>) => {
      // Get company_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id || "")
        .single();

      // Check if settings exist
      const { data: existing } = await supabase
        .from("anomaly_detection_settings")
        .select("id")
        .eq("company_id", profile?.company_id || "")
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("anomaly_detection_settings")
          .update({
            ...data,
            updated_by: user?.id,
          })
          .eq("id", existing.id);

        if (error) throw error;
        return { id: existing.id };
      } else {
        // Create new
        const { data: newSettings, error } = await supabase
          .from("anomaly_detection_settings")
          .insert({
            ...DEFAULT_SETTINGS,
            ...data,
            company_id: profile?.company_id,
            updated_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        return newSettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomaly-settings"] });
      toast({ title: "Anomaly detection settings saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save settings", description: error.message, variant: "destructive" });
    },
  });
}

// Reset to defaults
export function useResetAnomalySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id || "")
        .single();

      const { data: existing } = await supabase
        .from("anomaly_detection_settings")
        .select("id")
        .eq("company_id", profile?.company_id || "")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("anomaly_detection_settings")
          .update({
            ...DEFAULT_SETTINGS,
            updated_by: user?.id,
          })
          .eq("id", existing.id);

        if (error) throw error;
      }

      return { reset: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomaly-settings"] });
      toast({ title: "Settings reset to defaults" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reset settings", description: error.message, variant: "destructive" });
    },
  });
}
