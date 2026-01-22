import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useCompany } from "./useCompany";

export type BankStatement = Tables<"bank_statements">;
export type BankStatementInsert = TablesInsert<"bank_statements">;
export type BankStatementTransaction = Tables<"bank_statement_transactions">;
export type BankStatementTransactionInsert = TablesInsert<"bank_statement_transactions">;

export function useBankStatements() {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ["bank-statements", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from("bank_statements")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BankStatement[];
    },
    enabled: !!company?.id,
  });
}

export function useBankStatementTransactions(statementId: string | undefined) {
  return useQuery({
    queryKey: ["bank-statement-transactions", statementId],
    queryFn: async () => {
      if (!statementId) return [];

      const { data, error } = await supabase
        .from("bank_statement_transactions")
        .select("*")
        .eq("statement_id", statementId)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data as BankStatementTransaction[];
    },
    enabled: !!statementId,
  });
}

export function useCreateBankStatement() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({
      statement,
      transactions,
    }: {
      statement: Omit<BankStatementInsert, "company_id" | "uploaded_by">;
      transactions: Omit<BankStatementTransactionInsert, "statement_id">[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!company?.id) throw new Error("Company not found");

      // Create statement
      const { data: newStatement, error: statementError } = await supabase
        .from("bank_statements")
        .insert({
          ...statement,
          company_id: company.id,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (statementError) throw statementError;
      if (!newStatement) throw new Error("Failed to create statement");

      // Create transactions
      if (transactions.length > 0) {
        const { error: transactionsError } = await supabase
          .from("bank_statement_transactions")
          .insert(
            transactions.map((transaction) => ({
              ...transaction,
              statement_id: newStatement.id,
            }))
          );

        if (transactionsError) throw transactionsError;
      }

      return newStatement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-statements"] });
      toast({
        title: "Statement uploaded",
        description: "Bank statement has been uploaded and processed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload statement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBankStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statementId: string) => {
      const { error } = await supabase
        .from("bank_statements")
        .delete()
        .eq("id", statementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-statements"] });
      toast({
        title: "Statement deleted",
        description: "Bank statement has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete statement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
