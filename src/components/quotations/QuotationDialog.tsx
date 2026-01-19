import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Quotation,
  useCreateQuotation,
  useUpdateQuotation,
  useQuotationItems,
  useQuotationTechnicalScope,
  useQuotationDeliverables,
  useQuotationMilestones,
  useServiceTemplates,
  generateQuotationNumber,
} from "@/hooks/useQuotations";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/utils";

interface QuotationDialogProps {
  quotation?: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServiceItem {
  id: string;
  service_name: string;
  description: string;
  tech_stack: string;
  quantity: number;
  rate: number;
  total: number;
}

interface TechnicalScopeItem {
  id: string;
  scope_item: string;
  description: string;
  timeline_estimate: string;
  is_included: boolean;
}

interface DeliverableItem {
  id: string;
  deliverable_name: string;
  description: string;
}

interface MilestoneItem {
  id: string;
  phase_name: string;
  duration_days: number;
  deliverable: string;
}

const defaultTechnicalScope = [
  "UI/UX Design",
  "Frontend Development",
  "Backend Development",
  "Database Setup",
  "API Integrations",
  "Testing & QA",
  "Deployment",
];

const defaultDeliverables = [
  "Admin Panel",
  "User Dashboard",
  "Mobile Application",
  "Source Code",
  "Documentation",
  "Deployment Support",
];

export function QuotationDialog({
  quotation,
  open,
  onOpenChange,
}: QuotationDialogProps) {
  const isEditing = !!quotation;
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const { data: existingItems } = useQuotationItems(quotation?.id);
  const { data: existingScope } = useQuotationTechnicalScope(quotation?.id);
  const { data: existingDeliverables } = useQuotationDeliverables(quotation?.id);
  const { data: existingMilestones } = useQuotationMilestones(quotation?.id);
  const { data: serviceTemplates } = useServiceTemplates();
  const { data: company } = useCompany();
  const currency = company?.currency || "INR";

  const [formData, setFormData] = useState({
    quotation_number: "",
    client_name: "",
    client_email: "",
    client_address: "",
    company_name: "",
    quotation_date: new Date().toISOString().split("T")[0],
    valid_until: "",
    sales_person: "",
    account_manager: "",
    currency: currency,
    discount: 0,
    discount_type: "percentage" as "percentage" | "fixed",
    tax_rate: 0,
    validity_days: 15,
    support_period_months: 3,
    change_request_policy: "",
    ip_ownership: "",
    payment_delay_penalties: "",
    payment_terms: "",
    notes: "",
    status: "draft" as string,
  });

  const [services, setServices] = useState<ServiceItem[]>([
    { id: crypto.randomUUID(), service_name: "", description: "", tech_stack: "", quantity: 1, rate: 0, total: 0 },
  ]);

  const [technicalScope, setTechnicalScope] = useState<TechnicalScopeItem[]>(
    defaultTechnicalScope.map((item) => ({
      id: crypto.randomUUID(),
      scope_item: item,
      description: "",
      timeline_estimate: "",
      is_included: true,
    }))
  );

  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    defaultDeliverables.map((item) => ({
      id: crypto.randomUUID(),
      deliverable_name: item,
      description: "",
    }))
  );

  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    { id: crypto.randomUUID(), phase_name: "UI Design", duration_days: 7, deliverable: "Figma Designs" },
    { id: crypto.randomUUID(), phase_name: "Development", duration_days: 30, deliverable: "Complete Modules" },
    { id: crypto.randomUUID(), phase_name: "Testing", duration_days: 5, deliverable: "Bug-free Release" },
    { id: crypto.randomUUID(), phase_name: "Deployment", duration_days: 3, deliverable: "Live on Server" },
  ]);

  useEffect(() => {
    if (open) {
      if (quotation) {
        setFormData({
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          client_email: quotation.client_email || "",
          client_address: quotation.client_address || "",
          company_name: quotation.company_name || "",
          quotation_date: quotation.quotation_date,
          valid_until: quotation.valid_until || "",
          sales_person: quotation.sales_person || "",
          account_manager: quotation.account_manager || "",
          currency: quotation.currency || currency,
          discount: Number(quotation.discount) || 0,
          discount_type: (quotation.discount_type as "percentage" | "fixed") || "percentage",
          tax_rate: Number(quotation.tax_rate) || 0,
          validity_days: quotation.validity_days || 15,
          support_period_months: quotation.support_period_months || 3,
          change_request_policy: quotation.change_request_policy || "",
          ip_ownership: quotation.ip_ownership || "",
          payment_delay_penalties: quotation.payment_delay_penalties || "",
          payment_terms: quotation.payment_terms || "",
          notes: quotation.notes || "",
          status: quotation.status || "draft",
        });
      } else {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 15);
        setFormData({
          quotation_number: generateQuotationNumber(),
          client_name: "",
          client_email: "",
          client_address: "",
          company_name: "",
          quotation_date: new Date().toISOString().split("T")[0],
          valid_until: validUntil.toISOString().split("T")[0],
          sales_person: "",
          account_manager: "",
          currency: currency,
          discount: 0,
          discount_type: "percentage",
          tax_rate: 0,
          validity_days: 15,
          support_period_months: 3,
          change_request_policy: "",
          ip_ownership: "",
          payment_delay_penalties: "",
          payment_terms: "",
          notes: "",
          status: "draft",
        });
        setServices([
          { id: crypto.randomUUID(), service_name: "", description: "", tech_stack: "", quantity: 1, rate: 0, total: 0 },
        ]);
        setTechnicalScope(
          defaultTechnicalScope.map((item) => ({
            id: crypto.randomUUID(),
            scope_item: item,
            description: "",
            timeline_estimate: "",
            is_included: true,
          }))
        );
        setDeliverables(
          defaultDeliverables.map((item) => ({
            id: crypto.randomUUID(),
            deliverable_name: item,
            description: "",
          }))
        );
        setMilestones([
          { id: crypto.randomUUID(), phase_name: "UI Design", duration_days: 7, deliverable: "Figma Designs" },
          { id: crypto.randomUUID(), phase_name: "Development", duration_days: 30, deliverable: "Complete Modules" },
          { id: crypto.randomUUID(), phase_name: "Testing", duration_days: 5, deliverable: "Bug-free Release" },
          { id: crypto.randomUUID(), phase_name: "Deployment", duration_days: 3, deliverable: "Live on Server" },
        ]);
      }
    }
  }, [open, quotation, currency]);

  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      setServices(
        existingItems.map((item) => ({
          id: item.id,
          service_name: item.service_name,
          description: item.description || "",
          tech_stack: item.tech_stack || "",
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          total: Number(item.total),
        }))
      );
    }
  }, [existingItems]);

  useEffect(() => {
    if (existingScope && existingScope.length > 0) {
      setTechnicalScope(
        existingScope.map((item) => ({
          id: item.id,
          scope_item: item.scope_item,
          description: item.description || "",
          timeline_estimate: item.timeline_estimate || "",
          is_included: item.is_included ?? true,
        }))
      );
    }
  }, [existingScope]);

  useEffect(() => {
    if (existingDeliverables && existingDeliverables.length > 0) {
      setDeliverables(
        existingDeliverables.map((item) => ({
          id: item.id,
          deliverable_name: item.deliverable_name,
          description: item.description || "",
        }))
      );
    }
  }, [existingDeliverables]);

  useEffect(() => {
    if (existingMilestones && existingMilestones.length > 0) {
      setMilestones(
        existingMilestones.map((item) => ({
          id: item.id,
          phase_name: item.phase_name,
          duration_days: item.duration_days || 0,
          deliverable: item.deliverable || "",
        }))
      );
    }
  }, [existingMilestones]);

  const updateService = (id: string, field: keyof ServiceItem, value: string | number) => {
    setServices((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.total = updated.quantity * updated.rate;
        }
        return updated;
      })
    );
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { id: crypto.randomUUID(), service_name: "", description: "", tech_stack: "", quantity: 1, rate: 0, total: 0 },
    ]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const addDeliverable = () => {
    setDeliverables((prev) => [
      ...prev,
      { id: crypto.randomUUID(), deliverable_name: "", description: "" },
    ]);
  };

  const removeDeliverable = (id: string) => {
    setDeliverables((prev) => prev.filter((item) => item.id !== id));
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { id: crypto.randomUUID(), phase_name: "", duration_days: 0, deliverable: "" },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = services.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    formData.discount_type === "percentage"
      ? (subtotal * formData.discount) / 100
      : formData.discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * formData.tax_rate) / 100;
  const finalAmount = taxableAmount + taxAmount;

  const handleSubmit = async () => {
    if (!formData.client_name) {
      return;
    }

    try {
      const quotationData = {
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_address: formData.client_address || null,
        company_name: formData.company_name || null,
        quotation_date: formData.quotation_date,
        valid_until: formData.valid_until || null,
        sales_person: formData.sales_person || null,
        account_manager: formData.account_manager || null,
        currency: formData.currency,
        discount: discountAmount,
        discount_type: formData.discount_type,
        tax_rate: formData.tax_rate,
        validity_days: formData.validity_days,
        support_period_months: formData.support_period_months,
        change_request_policy: formData.change_request_policy || null,
        ip_ownership: formData.ip_ownership || null,
        payment_delay_penalties: formData.payment_delay_penalties || null,
        payment_terms: formData.payment_terms || null,
        notes: formData.notes || null,
        status: formData.status,
      };

      const items = services.map((s) => ({
        service_name: s.service_name,
        description: s.description || null,
        tech_stack: s.tech_stack || null,
        quantity: s.quantity,
        rate: s.rate,
        total: s.total,
      }));

      const scope = technicalScope
        .filter((s) => s.is_included)
        .map((s) => ({
          scope_item: s.scope_item,
          description: s.description || null,
          timeline_estimate: s.timeline_estimate || null,
          is_included: true,
        }));

      const deliverablesData = deliverables.map((d) => ({
        deliverable_name: d.deliverable_name,
        description: d.description || null,
      }));

      const milestonesData = milestones.map((m) => ({
        phase_name: m.phase_name,
        duration_days: m.duration_days,
        deliverable: m.deliverable || null,
      }));

      if (isEditing && quotation) {
        await updateQuotation.mutateAsync({
          id: quotation.id,
          quotation: quotationData,
          items,
          technicalScope: scope,
          deliverables: deliverablesData,
          milestones: milestonesData,
        });
      } else {
        await createQuotation.mutateAsync({
          quotation: quotationData,
          items,
          technicalScope: scope,
          deliverables: deliverablesData,
          milestones: milestonesData,
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Submit error:", error);
    }
  };

  const isPending = createQuotation.isPending || updateQuotation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Quotation" : "Create Quotation"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the quotation details below"
              : "Fill in the details to create a new quotation"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quotation_number">Quotation Number</Label>
                <Input
                  id="quotation_number"
                  value={formData.quotation_number}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotation_date">Date</Label>
                <Input
                  id="quotation_date"
                  type="date"
                  value={formData.quotation_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, quotation_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, client_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, company_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, client_email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, valid_until: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_person">Sales Person</Label>
                <Input
                  id="sales_person"
                  value={formData.sales_person}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sales_person: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_manager">Account Manager</Label>
                <Input
                  id="account_manager"
                  value={formData.account_manager}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, account_manager: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_address">Client Address</Label>
                <Textarea
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, client_address: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Pricing Summary</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, discount: Number(e.target.value) }))
                      }
                      className="flex-1"
                    />
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: "percentage" | "fixed") =>
                        setFormData((prev) => ({ ...prev, discount_type: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tax_rate: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal, formData.currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount, formData.currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({formData.tax_rate}%):</span>
                    <span>{formatCurrency(taxAmount, formData.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Final Amount:</span>
                  <span>{formatCurrency(finalAmount, formData.currency)}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms & Legal */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Payment Terms & Legal</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validity_days">Validity (Days)</Label>
                  <Input
                    id="validity_days"
                    type="number"
                    min="1"
                    value={formData.validity_days}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, validity_days: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_period_months">Support Period (Months)</Label>
                  <Input
                    id="support_period_months"
                    type="number"
                    min="0"
                    value={formData.support_period_months}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, support_period_months: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Textarea
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, payment_terms: e.target.value }))
                  }
                  placeholder="e.g., 40% Advance, 30% Mid-Phase, 30% Final"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="change_request_policy">Change Request Policy</Label>
                <Textarea
                  id="change_request_policy"
                  value={formData.change_request_policy}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, change_request_policy: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ip_ownership">IP & Source Code Ownership</Label>
                <Textarea
                  id="ip_ownership"
                  value={formData.ip_ownership}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ip_ownership: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_delay_penalties">Payment Delay Penalties</Label>
                <Textarea
                  id="payment_delay_penalties"
                  value={formData.payment_delay_penalties}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, payment_delay_penalties: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Services / Development Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addService}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
            <div className="space-y-3">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Service</Label>
                    <Input
                      value={service.service_name}
                      onChange={(e) => updateService(service.id, "service_name", e.target.value)}
                      placeholder="e.g., Website Development"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={service.description}
                      onChange={(e) => updateService(service.id, "description", e.target.value)}
                      placeholder="e.g., Corporate website"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Tech Stack</Label>
                    <Input
                      value={service.tech_stack}
                      onChange={(e) => updateService(service.id, "tech_stack", e.target.value)}
                      placeholder="e.g., Next.js, Tailwind"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={service.quantity}
                      onChange={(e) =>
                        updateService(service.id, "quantity", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.rate}
                      onChange={(e) =>
                        updateService(service.id, "rate", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={formatCurrency(service.total, formData.currency)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Technical Scope Tab */}
          <TabsContent value="scope" className="space-y-4 mt-4">
            <h3 className="font-semibold">Technical Scope of Work</h3>
            <div className="space-y-3">
              {technicalScope.map((scope) => (
                <div key={scope.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={scope.is_included}
                    onCheckedChange={(checked) => {
                      setTechnicalScope((prev) =>
                        prev.map((s) =>
                          s.id === scope.id ? { ...s, is_included: checked as boolean } : s
                        )
                      );
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Label>{scope.scope_item}</Label>
                    <Input
                      placeholder="Description (optional)"
                      value={scope.description}
                      onChange={(e) => {
                        setTechnicalScope((prev) =>
                          prev.map((s) =>
                            s.id === scope.id ? { ...s, description: e.target.value } : s
                          )
                        );
                      }}
                    />
                    <Input
                      placeholder="Timeline estimate (optional)"
                      value={scope.timeline_estimate}
                      onChange={(e) => {
                        setTechnicalScope((prev) =>
                          prev.map((s) =>
                            s.id === scope.id ? { ...s, timeline_estimate: e.target.value } : s
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Deliverables</h3>
              <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deliverable
              </Button>
            </div>
            <div className="space-y-3">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Deliverable name"
                      value={deliverable.deliverable_name}
                      onChange={(e) => {
                        setDeliverables((prev) =>
                          prev.map((d) =>
                            d.id === deliverable.id
                              ? { ...d, deliverable_name: e.target.value }
                              : d
                          )
                        );
                      }}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={deliverable.description}
                      onChange={(e) => {
                        setDeliverables((prev) =>
                          prev.map((d) =>
                            d.id === deliverable.id ? { ...d, description: e.target.value } : d
                          )
                        );
                      }}
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeliverable(deliverable.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Timeline & Milestones</h3>
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </div>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <Label className="text-xs">Phase</Label>
                    <Input
                      value={milestone.phase_name}
                      onChange={(e) => {
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id ? { ...m, phase_name: e.target.value } : m
                          )
                        );
                      }}
                      placeholder="e.g., UI Design"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Duration (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={milestone.duration_days}
                      onChange={(e) => {
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id
                              ? { ...m, duration_days: Number(e.target.value) }
                              : m
                          )
                        );
                      }}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Label className="text-xs">Deliverable</Label>
                    <Input
                      value={milestone.deliverable}
                      onChange={(e) => {
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id ? { ...m, deliverable: e.target.value } : m
                          )
                        );
                      }}
                      placeholder="e.g., Figma Designs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMilestone(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !formData.client_name}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Quotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
