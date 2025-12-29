import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Invoice = Tables<"invoices">;
export type InvoiceInsert = TablesInsert<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type InvoiceItemInsert = TablesInsert<"invoice_items">;

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Check for overdue invoices and update status
      const now = new Date();
      const invoicesWithStatus = data.map(invoice => {
        if (invoice.status === "sent" && new Date(invoice.due_date) < now) {
          return { ...invoice, status: "overdue" };
        }
        return invoice;
      });
      
      return invoicesWithStatus as Invoice[];
    },
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ["invoice-stats"],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, total, status, due_date");

      if (error) throw error;

      const now = new Date();
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      const paidAmount = invoices
        ?.filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      const pendingAmount = invoices
        ?.filter((inv) => inv.status === "sent" && new Date(inv.due_date) >= now)
        .reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      const overdueAmount = invoices
        ?.filter((inv) => inv.status === "sent" && new Date(inv.due_date) < now)
        .reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

      return { totalRevenue, paidAmount, pendingAmount, overdueAmount };
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-items", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as InvoiceItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: Omit<InvoiceInsert, "created_by">;
      items: Omit<InvoiceItemInsert, "invoice_id">[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = subtotal * (Number(invoice.tax_rate) || 0) / 100;
      const total = subtotal + taxAmount;

      // Create invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          ...invoice,
          subtotal,
          tax_amount: taxAmount,
          total,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            items.map((item) => ({
              ...item,
              invoice_id: newInvoice.id,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast({
        title: "Invoice created",
        description: "Your invoice has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      invoice,
      items,
    }: {
      id: string;
      invoice: Partial<Invoice>;
      items?: Omit<InvoiceItemInsert, "invoice_id">[];
    }) => {
      // Update invoice
      let updateData = { ...invoice };
      
      // Recalculate totals if items are provided
      if (items) {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = subtotal * (Number(invoice.tax_rate) || 0) / 100;
        const total = subtotal + taxAmount;
        updateData = { ...updateData, subtotal, tax_amount: taxAmount, total };
      }

      const { data, error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Replace invoice items if provided
      if (items) {
        // Delete existing items
        await supabase.from("invoice_items").delete().eq("invoice_id", id);
        
        // Insert new items
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(
              items.map((item) => ({
                ...item,
                invoice_id: id,
              }))
            );

          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-items", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast({
        title: "Invoice updated",
        description: "Your invoice has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete items first (cascade should handle this, but being explicit)
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast({
        title: "Invoice marked as paid",
        description: "The invoice status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast({
        title: "Invoice sent",
        description: "The invoice has been marked as sent",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Generate invoice number
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}-${random}`;
}
