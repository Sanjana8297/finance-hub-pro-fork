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

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // First, get the category name to find all transactions using it
      const { data: category, error: categoryError } = await supabase
        .from("category")
        .select("category_name")
        .eq("category_id", categoryId)
        .single();

      if (categoryError) throw categoryError;

      // Clear the category field from all transactions that use this category
      if (category?.category_name) {
        const { error: updateError } = await supabase
          .from("bank_statement_transactions")
          .update({ category: null })
          .eq("category", category.category_name);

        if (updateError) {
          console.warn("Failed to clear category from transactions:", updateError);
          // Don't throw - continue with category deletion even if transaction update fails
        }
      }

      // Delete the category
      const { error } = await supabase
        .from("category")
        .delete()
        .eq("category_id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["bank-statement-transactions"] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully. Transactions using this category have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
