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
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  email: string;
  amount: number;
  tax: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: "paid" | "sent" | "draft" | "overdue";
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    client: "Acme Corporation",
    email: "billing@acme.com",
    amount: 10000,
    tax: 2500,
    total: 12500,
    issueDate: "Dec 01, 2024",
    dueDate: "Dec 15, 2024",
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    client: "TechStart Inc",
    email: "accounts@techstart.io",
    amount: 7000,
    tax: 1750,
    total: 8750,
    issueDate: "Dec 10, 2024",
    dueDate: "Dec 28, 2024",
    status: "sent",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    client: "Global Solutions",
    email: "finance@globalsol.com",
    amount: 20000,
    tax: 4000,
    total: 24000,
    issueDate: "Nov 25, 2024",
    dueDate: "Dec 10, 2024",
    status: "overdue",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    client: "Digital Agency Co",
    email: "hello@digitalagency.co",
    amount: 4400,
    tax: 1100,
    total: 5500,
    issueDate: "Dec 20, 2024",
    dueDate: "Jan 05, 2025",
    status: "draft",
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-005",
    client: "Startup Labs",
    email: "finance@startuplabs.com",
    amount: 12000,
    tax: 3000,
    total: 15000,
    issueDate: "Dec 22, 2024",
    dueDate: "Jan 10, 2025",
    status: "sent",
  },
  {
    id: "6",
    invoiceNumber: "INV-2024-006",
    client: "Enterprise Corp",
    email: "ap@enterprise.com",
    amount: 40000,
    tax: 8000,
    total: 48000,
    issueDate: "Dec 15, 2024",
    dueDate: "Jan 15, 2025",
    status: "sent",
  },
];

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
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdueAmount = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success">
            ${paidAmount.toLocaleString()}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-info">
            ${pendingAmount.toLocaleString()}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-destructive">
            ${overdueAmount.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-10" />
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
              This Month
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
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.client}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      ${invoice.tax.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${invoice.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.issueDate}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.dueDate}
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
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send Reminder
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

export default Invoices;
