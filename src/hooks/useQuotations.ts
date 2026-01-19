import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useCompany } from "./useCompany";

export type Quotation = Tables<"quotations">;
export type QuotationInsert = TablesInsert<"quotations">;
export type QuotationItem = Tables<"quotation_items">;
export type QuotationItemInsert = TablesInsert<"quotation_items">;
export type QuotationTechnicalScope = Tables<"quotation_technical_scope">;
export type QuotationDeliverable = Tables<"quotation_deliverables">;
export type QuotationMilestone = Tables<"quotation_milestones">;
export type ServiceTemplate = Tables<"service_templates">;

export function useQuotations() {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ["quotations", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quotation[];
    },
    enabled: !!company?.id,
  });
}

export function useQuotation(quotationId: string | undefined) {
  return useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: async () => {
      if (!quotationId) return null;

      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (error) throw error;
      return data as Quotation;
    },
    enabled: !!quotationId,
  });
}

export function useQuotationItems(quotationId: string | undefined) {
  return useQuery({
    queryKey: ["quotation-items", quotationId],
    queryFn: async () => {
      if (!quotationId) return [];

      const { data, error } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as QuotationItem[];
    },
    enabled: !!quotationId,
  });
}

export function useQuotationTechnicalScope(quotationId: string | undefined) {
  return useQuery({
    queryKey: ["quotation-technical-scope", quotationId],
    queryFn: async () => {
      if (!quotationId) return [];

      const { data, error } = await supabase
        .from("quotation_technical_scope")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as QuotationTechnicalScope[];
    },
    enabled: !!quotationId,
  });
}

export function useQuotationDeliverables(quotationId: string | undefined) {
  return useQuery({
    queryKey: ["quotation-deliverables", quotationId],
    queryFn: async () => {
      if (!quotationId) return [];

      const { data, error } = await supabase
        .from("quotation_deliverables")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as QuotationDeliverable[];
    },
    enabled: !!quotationId,
  });
}

export function useQuotationMilestones(quotationId: string | undefined) {
  return useQuery({
    queryKey: ["quotation-milestones", quotationId],
    queryFn: async () => {
      if (!quotationId) return [];

      const { data, error } = await supabase
        .from("quotation_milestones")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as QuotationMilestone[];
    },
    enabled: !!quotationId,
  });
}

export function useServiceTemplates() {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ["service-templates", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from("service_templates")
        .select("*")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("service_name", { ascending: true });

      if (error) throw error;
      return data as ServiceTemplate[];
    },
    enabled: !!company?.id,
  });
}

export function generateQuotationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `QT-${year}-${random}`;
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({
      quotation,
      items,
      technicalScope,
      deliverables,
      milestones,
    }: {
      quotation: Omit<QuotationInsert, "company_id" | "quotation_number">;
      items: Omit<QuotationItemInsert, "quotation_id">[];
      technicalScope?: Omit<QuotationTechnicalScope, "id" | "quotation_id" | "created_at">[];
      deliverables?: Omit<QuotationDeliverable, "id" | "quotation_id" | "created_at">[];
      milestones?: Omit<QuotationMilestone, "id" | "quotation_id" | "created_at">[];
    }) => {
      if (!company?.id) throw new Error("Company not found");

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
      const discountAmount =
        quotation.discount_type === "percentage"
          ? (subtotal * Number(quotation.discount || 0)) / 100
          : Number(quotation.discount || 0);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * Number(quotation.tax_rate || 0)) / 100;
      const finalAmount = taxableAmount + taxAmount;

      // Create quotation
      const quotationNumber = generateQuotationNumber();
      const { data: quotationData, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          ...quotation,
          company_id: company.id,
          quotation_number: quotationNumber,
          subtotal,
          discount: discountAmount,
          tax_amount: taxAmount,
          final_amount: finalAmount,
        })
        .select()
        .single();

      if (quotationError) throw quotationError;
      if (!quotationData) throw new Error("Failed to create quotation");

      // Create items
      if (items.length > 0) {
        const itemsToInsert = items.map((item, index) => ({
          ...item,
          quotation_id: quotationData.id,
          display_order: index,
        }));

        const { error: itemsError } = await supabase
          .from("quotation_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Create technical scope
      if (technicalScope && technicalScope.length > 0) {
        const scopeToInsert = technicalScope.map((scope, index) => ({
          ...scope,
          quotation_id: quotationData.id,
          display_order: index,
        }));

        const { error: scopeError } = await supabase
          .from("quotation_technical_scope")
          .insert(scopeToInsert);

        if (scopeError) throw scopeError;
      }

      // Create deliverables
      if (deliverables && deliverables.length > 0) {
        const deliverablesToInsert = deliverables.map((deliverable, index) => ({
          ...deliverable,
          quotation_id: quotationData.id,
          display_order: index,
        }));

        const { error: deliverablesError } = await supabase
          .from("quotation_deliverables")
          .insert(deliverablesToInsert);

        if (deliverablesError) throw deliverablesError;
      }

      // Create milestones
      if (milestones && milestones.length > 0) {
        const milestonesToInsert = milestones.map((milestone, index) => ({
          ...milestone,
          quotation_id: quotationData.id,
          display_order: index,
        }));

        const { error: milestonesError } = await supabase
          .from("quotation_milestones")
          .insert(milestonesToInsert);

        if (milestonesError) throw milestonesError;
      }

      return quotationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Quotation created",
        description: "Your quotation has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create quotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      quotation,
      items,
      technicalScope,
      deliverables,
      milestones,
    }: {
      id: string;
      quotation?: Partial<QuotationInsert>;
      items?: Omit<QuotationItemInsert, "quotation_id">[];
      technicalScope?: Omit<QuotationTechnicalScope, "id" | "quotation_id" | "created_at">[];
      deliverables?: Omit<QuotationDeliverable, "id" | "quotation_id" | "created_at">[];
      milestones?: Omit<QuotationMilestone, "id" | "quotation_id" | "created_at">[];
    }) => {
      // Update quotation if provided
      if (quotation) {
        let updateData = { ...quotation };

        // Recalculate totals if items are provided
        if (items) {
          const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
          const discountAmount =
            quotation.discount_type === "percentage"
              ? (subtotal * Number(quotation.discount || 0)) / 100
              : Number(quotation.discount || 0);
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = (taxableAmount * Number(quotation.tax_rate || 0)) / 100;
          const finalAmount = taxableAmount + taxAmount;

          updateData = {
            ...updateData,
            subtotal,
            discount: discountAmount,
            tax_amount: taxAmount,
            final_amount: finalAmount,
          };
        }

        const { error: quotationError } = await supabase
          .from("quotations")
          .update(updateData)
          .eq("id", id);

        if (quotationError) throw quotationError;
      }

      // Replace items if provided
      if (items) {
        await supabase.from("quotation_items").delete().eq("quotation_id", id);

        if (items.length > 0) {
          const itemsToInsert = items.map((item, index) => ({
            ...item,
            quotation_id: id,
            display_order: index,
          }));

          const { error: itemsError } = await supabase
            .from("quotation_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      // Replace technical scope if provided
      if (technicalScope !== undefined) {
        await supabase
          .from("quotation_technical_scope")
          .delete()
          .eq("quotation_id", id);

        if (technicalScope.length > 0) {
          const scopeToInsert = technicalScope.map((scope, index) => ({
            ...scope,
            quotation_id: id,
            display_order: index,
          }));

          const { error: scopeError } = await supabase
            .from("quotation_technical_scope")
            .insert(scopeToInsert);

          if (scopeError) throw scopeError;
        }
      }

      // Replace deliverables if provided
      if (deliverables !== undefined) {
        await supabase.from("quotation_deliverables").delete().eq("quotation_id", id);

        if (deliverables.length > 0) {
          const deliverablesToInsert = deliverables.map((deliverable, index) => ({
            ...deliverable,
            quotation_id: id,
            display_order: index,
          }));

          const { error: deliverablesError } = await supabase
            .from("quotation_deliverables")
            .insert(deliverablesToInsert);

          if (deliverablesError) throw deliverablesError;
        }
      }

      // Replace milestones if provided
      if (milestones !== undefined) {
        await supabase.from("quotation_milestones").delete().eq("quotation_id", id);

        if (milestones.length > 0) {
          const milestonesToInsert = milestones.map((milestone, index) => ({
            ...milestone,
            quotation_id: id,
            display_order: index,
          }));

          const { error: milestonesError } = await supabase
            .from("quotation_milestones")
            .insert(milestonesToInsert);

          if (milestonesError) throw milestonesError;
        }
      }

      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["quotation-items", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["quotation-technical-scope", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["quotation-deliverables", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["quotation-milestones", variables.id] });
      toast({
        title: "Quotation updated",
        description: "Your quotation has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update quotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useConvertQuotationToInvoice() {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      if (!company?.id) throw new Error("Company not found");

      // Fetch quotation with all related data
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (quotationError || !quotation) throw new Error("Quotation not found");

      // Fetch quotation items
      const { data: items, error: itemsError } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId);

      if (itemsError) throw itemsError;

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          company_id: company.id,
          client_name: quotation.client_name,
          client_email: quotation.client_email,
          client_address: quotation.client_address,
          subtotal: quotation.subtotal,
          tax_rate: quotation.tax_rate,
          tax_amount: quotation.tax_amount,
          total: quotation.final_amount,
          currency: quotation.currency,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: dueDate.toISOString().split("T")[0],
          status: "draft",
          notes: quotation.notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error("Failed to create invoice");

      // Create invoice items from quotation items
      if (items && items.length > 0) {
        const invoiceItems = items.map((item) => ({
          invoice_id: invoice.id,
          description: `${item.service_name}${item.description ? ` - ${item.description}` : ""}${item.tech_stack ? ` (${item.tech_stack})` : ""}`,
          quantity: item.quantity,
          unit_price: item.rate,
          amount: item.total,
        }));

        const { error: invoiceItemsError } = await supabase
          .from("invoice_items")
          .insert(invoiceItems);

        if (invoiceItemsError) throw invoiceItemsError;
      }

      // Update quotation status to converted
      await supabase
        .from("quotations")
        .update({
          status: "converted",
          converted_to_invoice_id: invoice.id,
        })
        .eq("id", quotationId);

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Quotation converted",
        description: "Invoice has been created from quotation",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to convert quotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
