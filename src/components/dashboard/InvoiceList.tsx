import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRecentInvoices } from "@/hooks/useDashboardStats";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft" | "sent";

const statusVariants: Record<InvoiceStatus, "success" | "warning" | "destructive" | "muted"> = {
  paid: "success",
  pending: "warning",
  sent: "warning",
  overdue: "destructive",
  draft: "muted",
};

const statusLabels: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  sent: "Sent",
  overdue: "Overdue",
  draft: "Draft",
};

export function InvoiceList() {
  const { data: invoices, isLoading } = useRecentInvoices();
  const { data: company } = useCompany();
  const currency = company?.currency || "INR";

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const invoiceList = invoices || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/invoices">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoiceList.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No invoices yet
          </div>
        ) : (
          <div className="space-y-3">
            {invoiceList.map((invoice) => {
              const status = (invoice.status as InvoiceStatus) || "draft";
              return (
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
                      <p className="font-semibold">{formatCurrency(invoice.amount, currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant={statusVariants[status]}>
                      {statusLabels[status]}
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
