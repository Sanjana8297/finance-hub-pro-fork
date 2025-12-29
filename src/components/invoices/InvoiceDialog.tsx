import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Invoice,
  InvoiceItem,
  useCreateInvoice,
  useUpdateInvoice,
  useInvoiceItems,
  generateInvoiceNumber,
} from "@/hooks/useInvoices";

interface InvoiceDialogProps {
  invoice?: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export function InvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: InvoiceDialogProps) {
  const isEditing = !!invoice;
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: existingItems } = useInvoiceItems(invoice?.id);

  const [formData, setFormData] = useState({
    invoice_number: "",
    client_name: "",
    client_email: "",
    client_address: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    tax_rate: 0,
    notes: "",
    status: "draft" as string,
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setFormData({
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name,
          client_email: invoice.client_email || "",
          client_address: invoice.client_address || "",
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          tax_rate: Number(invoice.tax_rate) || 0,
          notes: invoice.notes || "",
          status: invoice.status || "draft",
        });
      } else {
        setFormData({
          invoice_number: generateInvoiceNumber(),
          client_name: "",
          client_email: "",
          client_address: "",
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          tax_rate: 0,
          notes: "",
          status: "draft",
        });
        setItems([
          { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, amount: 0 },
        ]);
      }
    }
  }, [open, invoice]);

  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      setItems(
        existingItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          amount: Number(item.amount),
        }))
      );
    }
  }, [existingItems]);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unit_price") {
          updated.amount = updated.quantity * updated.unit_price;
        }
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    const validItems = items.filter((item) => item.description && item.amount > 0);
    
    if (!formData.client_name || !formData.due_date || validItems.length === 0) {
      return;
    }

    const invoiceData = {
      invoice_number: formData.invoice_number,
      client_name: formData.client_name,
      client_email: formData.client_email || null,
      client_address: formData.client_address || null,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      tax_rate: formData.tax_rate,
      notes: formData.notes || null,
      status: formData.status,
    };

    const itemsData = validItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    }));

    if (isEditing && invoice) {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        invoice: invoiceData,
        items: itemsData,
      });
    } else {
      await createInvoice.mutateAsync({
        invoice: invoiceData,
        items: itemsData,
      });
    }

    onOpenChange(false);
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the invoice details below"
              : "Fill in the details to create a new invoice"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, invoice_number: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Client Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, client_name: e.target.value }))
                  }
                  placeholder="Company or client name"
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
                  placeholder="billing@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_address">Client Address</Label>
              <Textarea
                id="client_address"
                value={formData.client_address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, client_address: e.target.value }))
                }
                placeholder="Street address, city, country"
                rows={2}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, issue_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Service or product"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(item.id, "unit_price", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      value={`$${item.amount.toFixed(2)}`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Totals */}
          <div className="flex justify-end">
            <div className="w-full space-y-2 sm:w-64">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Tax (%)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tax_rate: Number(e.target.value),
                    }))
                  }
                  className="w-20 text-right"
                />
                <span className="w-20 text-right text-sm">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Payment terms, thank you message, etc."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
