import { useState } from "react";
import { format } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { FileUploadZone } from "@/components/receipts/FileUploadZone";
import { ReceiptForm } from "@/components/receipts/ReceiptForm";
import { VerifyReceiptDialog } from "@/components/receipts/VerifyReceiptDialog";
import { useReceipts, useReceiptStats, useDeleteReceipt, Receipt } from "@/hooks/useReceipts";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle; label: string }> = {
  verified: {
    variant: "success",
    icon: CheckCircle,
    label: "Verified",
  },
  pending: {
    variant: "warning",
    icon: Clock,
    label: "Pending",
  },
  rejected: {
    variant: "destructive",
    icon: XCircle,
    label: "Rejected",
  },
};

const Receipts = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [verifyReceipt, setVerifyReceipt] = useState<Receipt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { roles } = useAuth();
  const { data: receipts, isLoading } = useReceipts();
  const { data: stats } = useReceiptStats();
  const deleteReceipt = useDeleteReceipt();

  // Check if user has finance access for verification
  const canVerify = roles.some((r) =>
    ["super_admin", "admin", "finance_manager", "accountant"].includes(r)
  );

  const filteredReceipts = receipts?.filter(
    (r) =>
      r.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReceipt.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
            <p className="text-muted-foreground">
              Manage and track all your bank receipts
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Quick Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Receipt</DialogTitle>
                  <DialogDescription>
                    Drag and drop your receipt file or click to browse.
                  </DialogDescription>
                </DialogHeader>
                <FileUploadZone
                  onUploadComplete={() => {
                    setUploadOpen(false);
                    setAddOpen(true);
                  }}
                  className="mt-4"
                />
              </DialogContent>
            </Dialog>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Receipt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Receipt</DialogTitle>
                  <DialogDescription>
                    Fill in the receipt details below. Upload an image or PDF for record-keeping.
                  </DialogDescription>
                </DialogHeader>
                <ReceiptForm onSuccess={() => setAddOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Receipts</p>
          <p className="text-2xl font-bold">
            {stats?.total.toLocaleString() ?? "—"}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">{stats?.thisMonth ?? "—"}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending Verification</p>
          <p className="text-2xl font-bold text-warning">
            {stats?.pending ?? "—"}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">
            ${stats?.totalValue.toLocaleString() ?? "—"}
          </p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              All Status
            </Button>
            <Button variant="outline" size="sm">
              All Categories
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredReceipts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No receipts found</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setAddOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts?.map((receipt) => {
                  const status = statusConfig[receipt.status || "pending"];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>{receipt.vendor}</TableCell>
                      <TableCell>
                        {receipt.category ? (
                          <Badge variant="muted">{receipt.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(receipt.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(receipt.receipt_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                          {receipt.verification_notes && (
                            <Tooltip>
                              <TooltipTrigger>
                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{receipt.verification_notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {receipt.file_url ? (
                          <a
                            href={receipt.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canVerify && receipt.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setVerifyReceipt(receipt)}
                                  className="text-primary"
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Verify Receipt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {receipt.file_url && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={receipt.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(receipt.id)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receipt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Receipt Dialog */}
      <VerifyReceiptDialog
        receipt={verifyReceipt}
        open={!!verifyReceipt}
        onOpenChange={(open) => !open && setVerifyReceipt(null)}
      />
    </DashboardLayout>
  );
};

export default Receipts;
