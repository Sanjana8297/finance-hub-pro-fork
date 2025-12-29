import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { RejectExpenseDialog } from "@/components/expenses/RejectExpenseDialog";
import { DelegationManager } from "@/components/expenses/DelegationManager";
import {
  useExpenses,
  useExpenseStats,
  useApproveExpense,
  useRejectExpense,
  useDeleteExpense,
  Expense,
} from "@/hooks/useExpenses";
import { useHasDelegatedAuthority } from "@/hooks/useExpenseDelegations";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig = {
  approved: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Approved",
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

const Expenses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [expenseToReject, setExpenseToReject] = useState<Expense | null>(null);

  const { hasFinanceAccess, isAdmin } = useAuth();
  const { data: expenses, isLoading } = useExpenses();
  const { data: stats, isLoading: statsLoading } = useExpenseStats();
  const { data: hasDelegatedAuthority } = useHasDelegatedAuthority();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const deleteExpense = useDeleteExpense();

  // User can approve if they have finance access, are admin, or have been delegated authority
  const canApprove = hasFinanceAccess() || isAdmin() || hasDelegatedAuthority;

  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch =
      !searchQuery ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || expense.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      await deleteExpense.mutateAsync(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleRejectClick = (expense: Expense) => {
    setExpenseToReject(expense);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (expenseToReject) {
      await rejectExpense.mutateAsync({ id: expenseToReject.id, notes: reason });
      setRejectDialogOpen(false);
      setExpenseToReject(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Track and approve company expenses
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Expense
          </Button>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          {canApprove && (
            <TabsTrigger value="delegations" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Delegations
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">
              ${stats?.totalAmount?.toLocaleString() || 0}
            </p>
          )}
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-success">
              ${stats?.approvedAmount?.toLocaleString() || 0}
            </p>
          )}
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending Approval</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-warning">
              ${stats?.pendingAmount?.toLocaleString() || 0}
            </p>
          )}
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">{stats?.thisMonthCount || 0} expenses</p>
          )}
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
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
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("approved")}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
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
              ) : filteredExpenses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No expenses found</p>
                    <p className="text-sm text-muted-foreground">
                      Submit your first expense to get started
                    </p>
                    <Button className="mt-4" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit Expense
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses?.map((expense) => {
                  const status = statusConfig[expense.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const submitterName = expense.profiles?.full_name || "Unknown";
                  const submitterInitial = submitterName.charAt(0);

                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        {expense.expense_categories?.name ? (
                          <Badge variant="muted">{expense.expense_categories.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{expense.department || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={expense.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${submitterName}`}
                            />
                            <AvatarFallback>{submitterInitial}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{submitterName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(expense.expense_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {expense.receipt_id ? (
                          <Badge variant="success" className="gap-1">
                            <Receipt className="h-3 w-3" />
                            Attached
                          </Badge>
                        ) : (
                          <Badge variant="muted">Missing</Badge>
                        )}
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
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {expense.status === "pending" && canApprove && (
                              <>
                                <DropdownMenuItem
                                  className="text-success"
                                  onClick={() => approveExpense.mutate(expense.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRejectClick(expense)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(expense)}
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
        </TabsContent>

        {canApprove && (
          <TabsContent value="delegations">
            <DelegationManager />
          </TabsContent>
        )}
      </Tabs>

      {/* Expense Dialog */}
      <ExpenseDialog
        expense={selectedExpense}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be
              undone.
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

      {/* Reject Expense Dialog */}
      <RejectExpenseDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        expenseDescription={expenseToReject?.description || ""}
        expenseAmount={Number(expenseToReject?.amount) || 0}
        onConfirm={handleRejectConfirm}
        isLoading={rejectExpense.isPending}
      />
    </DashboardLayout>
  );
};

export default Expenses;
