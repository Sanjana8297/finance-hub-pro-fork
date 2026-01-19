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
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  DollarSign,
  Download,
  Loader2,
  Mail,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useQuotations, Quotation, useConvertQuotationToInvoice } from "@/hooks/useQuotations";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { QuotationDialog } from "@/components/quotations/QuotationDialog";

const statusConfig = {
  draft: {
    variant: "muted" as const,
    icon: FileText,
    label: "Draft",
  },
  sent: {
    variant: "info" as const,
    icon: Send,
    label: "Sent",
  },
  approved: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
  },
  converted: {
    variant: "default" as const,
    icon: FileCheck,
    label: "Converted",
  },
  expired: {
    variant: "destructive" as const,
    icon: AlertTriangle,
    label: "Expired",
  },
};

const Quotations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const { data: quotations, isLoading } = useQuotations();
  const { data: company } = useCompany();
  const convertToInvoice = useConvertQuotationToInvoice();

  const currency = company?.currency || "INR";

  const filteredQuotations = quotations?.filter((quotation) => {
    const matchesSearch =
      quotation.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    setSelectedQuotation(null);
    setDialogOpen(true);
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDialogOpen(true);
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    try {
      await convertToInvoice.mutateAsync(quotation.id);
      toast({
        title: "Success",
        description: "Quotation converted to invoice successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: quotations?.length || 0,
    draft: quotations?.filter((q) => q.status === "draft").length || 0,
    sent: quotations?.filter((q) => q.status === "sent").length || 0,
    approved: quotations?.filter((q) => q.status === "approved").length || 0,
    totalValue: quotations?.reduce((sum, q) => sum + Number(q.final_amount), 0) || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotations</h1>
            <p className="text-muted-foreground">
              Create and manage quotations for your clients
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                </div>
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue, currency, { compact: true })}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  onClick={() => setStatusFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  onClick={() => setStatusFilter("draft")}
                >
                  Draft
                </Button>
                <Button
                  variant={statusFilter === "sent" ? "default" : "outline"}
                  onClick={() => setStatusFilter("sent")}
                >
                  Sent
                </Button>
                <Button
                  variant={statusFilter === "approved" ? "default" : "outline"}
                  onClick={() => setStatusFilter("approved")}
                >
                  Approved
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredQuotations && filteredQuotations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => {
                    const config = statusConfig[quotation.status as keyof typeof statusConfig] || statusConfig.draft;
                    const StatusIcon = config.icon;

                    return (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">
                          {quotation.quotation_number}
                        </TableCell>
                        <TableCell>{quotation.client_name}</TableCell>
                        <TableCell>{quotation.company_name || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(quotation.quotation_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {quotation.valid_until
                            ? format(new Date(quotation.valid_until), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(quotation.final_amount), currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(quotation)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {quotation.status !== "converted" && (
                                <DropdownMenuItem
                                  onClick={() => handleConvertToInvoice(quotation)}
                                  disabled={convertToInvoice.isPending}
                                >
                                  <FileCheck className="mr-2 h-4 w-4" />
                                  Convert to Invoice
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quotations found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first quotation"}
                </p>
                {!searchQuery && !statusFilter && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quotation
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <QuotationDialog
          quotation={selectedQuotation}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default Quotations;
