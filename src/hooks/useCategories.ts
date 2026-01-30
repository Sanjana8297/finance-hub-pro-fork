import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Category {
  category_id: string;
  category_name: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category")
        .select("*")
        .order("category_name", { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryName: string) => {
      const trimmedName = categoryName.trim();
      
      if (!trimmedName) {
        throw new Error("Category name cannot be empty");
      }

      // Check if category already exists
      const { data: existing } = await supabase
        .from("category")
        .select("*")
        .ilike("category_name", trimmedName)
        .single();

      if (existing) {
        // Category already exists, return it
        return existing as Category;
      }

      // Create new category
      const { data, error } = await supabase
        .from("category")
        .insert({
          category_name: trimmedName,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Category created",
        description: "New category has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
