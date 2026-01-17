import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useCompany } from "./useCompany";

export type Employee = Tables<"employees">;
export type EmployeeInsert = TablesInsert<"employees">;
export type EmployeeUpdate = TablesUpdate<"employees">;

export function useEmployees() {
  const { data: company } = useCompany();
  
  return useQuery({
    queryKey: ["employees", company?.id],
    queryFn: async () => {
      let query = supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (company?.id) {
        query = query.eq("company_id", company.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Employee[];
    },
    enabled: !!company?.id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (employee: Omit<EmployeeInsert, "company_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          ...employee,
          company_id: company?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all employee queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Employee added",
        description: "The employee has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({ id, employee }: { id: string; employee: EmployeeUpdate }) => {
      const { data, error } = await supabase
        .from("employees")
        .update(employee)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", company?.id] });
      toast({
        title: "Employee updated",
        description: "The employee has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", company?.id] });
      toast({
        title: "Employee removed",
        description: "The employee has been successfully removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
