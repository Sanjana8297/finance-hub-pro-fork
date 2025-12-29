import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  dueDate: string;
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    client: "Acme Corporation",
    amount: 12500,
    status: "paid",
    dueDate: "Dec 15, 2024",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    client: "TechStart Inc",
    amount: 8750,
    status: "pending",
    dueDate: "Dec 28, 2024",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    client: "Global Solutions",
    amount: 24000,
    status: "overdue",
    dueDate: "Dec 10, 2024",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    client: "Digital Agency Co",
    amount: 5500,
    status: "draft",
    dueDate: "Jan 05, 2025",
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-005",
    client: "Startup Labs",
    amount: 15000,
    status: "pending",
    dueDate: "Jan 10, 2025",
  },
];

const statusVariants: Record<Invoice["status"], "success" | "warning" | "destructive" | "muted"> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  draft: "muted",
};

const statusLabels: Record<Invoice["status"], string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  draft: "Draft",
};

export function InvoiceList() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Button variant="outline" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-all hover:border-primary/20 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {invoice.client.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">{invoice.client}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Due {invoice.dueDate}</p>
                </div>
                <Badge variant={statusVariants[invoice.status]}>
                  {statusLabels[invoice.status]}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Download PDF</DropdownMenuItem>
                    <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
