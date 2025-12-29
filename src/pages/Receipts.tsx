import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";

interface Receipt {
  id: string;
  receiptNumber: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  status: "verified" | "pending" | "rejected";
  attachedTo?: string;
}

const receipts: Receipt[] = [
  {
    id: "1",
    receiptNumber: "RCP-2024-001",
    vendor: "Office Depot",
    category: "Office Supplies",
    amount: 234.5,
    date: "Dec 28, 2024",
    status: "verified",
    attachedTo: "INV-2024-001",
  },
  {
    id: "2",
    receiptNumber: "RCP-2024-002",
    vendor: "AWS",
    category: "Technology",
    amount: 1250.0,
    date: "Dec 27, 2024",
    status: "verified",
  },
  {
    id: "3",
    receiptNumber: "RCP-2024-003",
    vendor: "United Airlines",
    category: "Travel",
    amount: 856.0,
    date: "Dec 26, 2024",
    status: "pending",
  },
  {
    id: "4",
    receiptNumber: "RCP-2024-004",
    vendor: "Marriott Hotels",
    category: "Travel",
    amount: 425.0,
    date: "Dec 25, 2024",
    status: "pending",
  },
  {
    id: "5",
    receiptNumber: "RCP-2024-005",
    vendor: "Unknown Vendor",
    category: "Other",
    amount: 150.0,
    date: "Dec 24, 2024",
    status: "rejected",
  },
  {
    id: "6",
    receiptNumber: "RCP-2024-006",
    vendor: "Google Cloud",
    category: "Technology",
    amount: 2100.0,
    date: "Dec 23, 2024",
    status: "verified",
    attachedTo: "EXP-2024-012",
  },
  {
    id: "7",
    receiptNumber: "RCP-2024-007",
    vendor: "FedEx",
    category: "Shipping",
    amount: 78.5,
    date: "Dec 22, 2024",
    status: "verified",
  },
];

const statusConfig = {
  verified: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Verified",
  },
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pending",
  },
  rejected: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
  },
};

const Receipts = () => {
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
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Receipt
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Receipt
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Receipts</p>
          <p className="text-2xl font-bold">1,284</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">127</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending Verification</p>
          <p className="text-2xl font-bold text-warning">12</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">$284,520</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search receipts..." className="pl-10" />
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
                <TableHead>Linked To</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => {
                const status = statusConfig[receipt.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell>{receipt.vendor}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{receipt.category}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${receipt.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receipt.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {receipt.attachedTo ? (
                        <Badge variant="outline">{receipt.attachedTo}</Badge>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Receipts;
