import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  useStatementTransactionsForExpenses,
  useRealtimeStatementSync,
} from "@/hooks/useStatementExpenses";
import { formatCurrency } from "@/lib/utils";
import { useCompany } from "@/hooks/useCompany";

export function StatementExpensesSync() {
  const { data: company } = useCompany();
  // Use the original hook - it already filters out imported transactions
  const { data: transactions, isLoading, refetch } = useStatementTransactionsForExpenses();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  // Enable real-time sync for new statements
  useRealtimeStatementSync();

  // Strict client-side deduplication - ensure no duplicates are displayed
  const strictlyDedupedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Use transaction ID as the only source of truth for uniqueness
    const seenIds = new Set<string>();
    const deduped: typeof transactions = [];
    
    for (const tx of transactions) {
      if (!seenIds.has(tx.transactionId)) {
        seenIds.add(tx.transactionId);
        deduped.push(tx);
      }
    }
    
    return deduped;
  }, [transactions]);

  const currency = company?.currency || "INR";
  const hasTransactions = strictlyDedupedTransactions && strictlyDedupedTransactions.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Import from Bank Statements
              </CardTitle>
              <CardDescription>
                Automatically display IT Expenses and Office expense transactions from uploaded bank statements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasTransactions ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No transactions to display</p>
              <p className="text-sm text-muted-foreground">
                Upload bank statements with IT Expenses or Office expense to see transactions here
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strictlyDedupedTransactions.map((transaction) => (
                    <TableRow key={transaction.transactionId}>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(transaction.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
