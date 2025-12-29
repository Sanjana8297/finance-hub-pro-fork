import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import {
  useInvoices,
  useInvoiceStats,
  useDeleteInvoice,
  useMarkInvoicePaid,
  useSendInvoice,
  Invoice,
} from "@/hooks/useInvoices";

const statusConfig = {
  paid: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Paid",
  },
  sent: {
    variant: "info" as const,
    icon: Send,
    label: "Sent",
  },
  draft: {
    variant: "muted" as const,
    icon: FileText,
    label: "Draft",
  },
  overdue: {
    variant: "destructive" as const,
    icon: AlertTriangle,
    label: "Overdue",
  },
};

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useInvoices();
  const { data: stats, isLoading: statsLoading } = useInvoiceStats();
  const deleteInvoice = useDeleteInvoice();
  const markPaid = useMarkInvoicePaid();
  const sendInvoice = useSendInvoice();

  const getDisplayStatus = (invoice: Invoice) => {
    if (invoice.status === "sent" && new Date(invoice.due_date) < new Date()) {
      return "overdue";
    }
    return invoice.status || "draft";
  };

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      !searchQuery ||
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase());

    const displayStatus = getDisplayStatus(invoice);
    const matchesStatus = !statusFilter || displayStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (invoiceToDelete) {
      await deleteInvoice.mutateAsync(invoiceToDelete.id);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Create and manage client invoices
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">
              ${stats?.totalRevenue?.toLocaleString() || 0}
            </p>
          )}
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-success">
              ${stats?.paidAmount?.toLocaleString() || 0}
            </p>
          )}
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-info">
              ${stats?.pendingAmount?.toLocaleString() || 0}
            </p>
          )}
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-destructive">
              ${stats?.overdueAmount?.toLocaleString() || 0}
            </p>
          )}
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </Button>
            <Button
              variant={statusFilter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("sent")}
            >
              Sent
            </Button>
            <Button
              variant={statusFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("paid")}
            >
              Paid
            </Button>
            <Button
              variant={statusFilter === "overdue" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("overdue")}
            >
              Overdue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredInvoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No invoices found</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first invoice to get started
                    </p>
                    <Button className="mt-4" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices?.map((invoice) => {
                  const displayStatus = getDisplayStatus(invoice);
                  const status = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.client_name}</p>
                          {invoice.client_email && (
                            <p className="text-sm text-muted-foreground">
                              {invoice.client_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        ${Number(invoice.subtotal).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        ${Number(invoice.tax_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(invoice.total).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.issue_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.due_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {invoice.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => sendInvoice.mutate(invoice.id)}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === "sent" || displayStatus === "overdue") && (
                              <DropdownMenuItem
                                onClick={() => markPaid.mutate(invoice.id)}
                              >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(invoice)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog
        invoice={selectedInvoice}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice{" "}
              <strong>{invoiceToDelete?.invoice_number}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Invoices;
