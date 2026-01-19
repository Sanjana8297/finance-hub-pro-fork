import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format, isBefore, isToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useRecurringExpenses,
  useDueRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  useGenerateExpenseFromRecurring,
  RecurringExpense,
  RecurringFrequency,
} from "@/hooks/useRecurringExpenses";
import { useExpenseCategories } from "@/hooks/useExpenses";
import { useCompany } from "@/hooks/useCompany";

const frequencyLabels: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function RecurringExpenseManager() {
  const { data: company } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<RecurringExpense | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    vendor: "",
    category_id: "",
    department: "",
    frequency: "monthly" as RecurringFrequency,
    next_due_date: new Date(),
    end_date: null as Date | null,
    auto_submit: false,
    notes: "",
  });

  const { data: expenses, isLoading } = useRecurringExpenses();
  const { data: dueExpenses } = useDueRecurringExpenses();
  const { data: categories } = useExpenseCategories();
  const createExpense = useCreateRecurringExpense();
  const updateExpense = useUpdateRecurringExpense();
  const deleteExpense = useDeleteRecurringExpense();
  const generateExpense = useGenerateExpenseFromRecurring();

  const handleCreate = () => {
    setSelectedExpense(null);
    setFormData({
      description: "",
      amount: "",
      vendor: "",
      category_id: "",
      department: "",
      frequency: "monthly",
      next_due_date: new Date(),
      end_date: null,
      auto_submit: false,
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setSelectedExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      vendor: expense.vendor || "",
      category_id: expense.category_id || "",
      department: expense.department || "",
      frequency: expense.frequency,
      next_due_date: new Date(expense.next_due_date),
      end_date: expense.end_date ? new Date(expense.end_date) : null,
      auto_submit: expense.auto_submit,
      notes: expense.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (expense: RecurringExpense) => {
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

  const handleToggleActive = async (expense: RecurringExpense) => {
    await updateExpense.mutateAsync({
      id: expense.id,
      is_active: !expense.is_active,
    });
  };

  const handleGenerate = async (expense: RecurringExpense) => {
    await generateExpense.mutateAsync(expense);
  };

  const handleSubmit = async () => {
    const data = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      vendor: formData.vendor || null,
      category_id: formData.category_id || null,
      department: formData.department || null,
      frequency: formData.frequency,
      next_due_date: format(formData.next_due_date, "yyyy-MM-dd"),
      end_date: formData.end_date
        ? format(formData.end_date, "yyyy-MM-dd")
        : null,
      auto_submit: formData.auto_submit,
      notes: formData.notes || null,
    };

    if (selectedExpense) {
      await updateExpense.mutateAsync({ id: selectedExpense.id, ...data });
    } else {
      await createExpense.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    const currency = company?.currency || "INR";
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDueStatus = (nextDue: string, isActive: boolean) => {
    if (!isActive) {
      return { status: "inactive", label: "Inactive", variant: "muted" as const };
    }
    const dueDate = new Date(nextDue);
    const today = new Date();
    if (isBefore(dueDate, today) && !isToday(dueDate)) {
      return { status: "overdue", label: "Overdue", variant: "destructive" as const };
    }
    if (isToday(dueDate)) {
      return { status: "due", label: "Due Today", variant: "warning" as const };
    }
    if (isBefore(dueDate, addDays(today, 7))) {
      return { status: "upcoming", label: "Upcoming", variant: "secondary" as const };
    }
    return { status: "scheduled", label: "Scheduled", variant: "success" as const };
  };

  const activeCount = expenses?.filter((e) => e.is_active).length || 0;
  const dueCount = dueExpenses?.length || 0;
  const monthlyTotal =
    expenses
      ?.filter((e) => e.is_active)
      .reduce((sum, e) => {
        const monthlyAmount =
          e.frequency === "weekly"
            ? e.amount * 4.33
            : e.frequency === "biweekly"
            ? e.amount * 2.17
            : e.frequency === "monthly"
            ? e.amount
            : e.frequency === "quarterly"
            ? e.amount / 3
            : e.amount / 12;
        return sum + monthlyAmount;
      }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Recurring</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{activeCount}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Now</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-warning">{dueCount}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Monthly</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Yearly</p>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(monthlyTotal * 12)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Due Expenses Alert */}
      {dueExpenses && dueExpenses.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Expenses Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dueExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg bg-background p-3"
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.vendor && `${expense.vendor} • `}
                      {formatCurrency(expense.amount)} • Due{" "}
                      {format(new Date(expense.next_due_date), "MMM d")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(expense)}
                    disabled={generateExpense.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recurring Expenses</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : expenses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No recurring expenses</p>
                    <p className="text-sm text-muted-foreground">
                      Add subscriptions and regular payments to track them automatically
                    </p>
                    <Button className="mt-4" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Recurring
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                expenses?.map((expense) => {
                  const dueStatus = getDueStatus(expense.next_due_date, expense.is_active);
                  return (
                    <TableRow
                      key={expense.id}
                      className={!expense.is_active ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          {expense.expense_categories?.name && (
                            <Badge variant="muted" className="mt-1">
                              {expense.expense_categories.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{expense.vendor || "—"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>{frequencyLabels[expense.frequency]}</TableCell>
                      <TableCell>
                        {format(new Date(expense.next_due_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dueStatus.variant}>{dueStatus.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {expense.is_active &&
                            dueStatus.status !== "scheduled" &&
                            dueStatus.status !== "upcoming" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleGenerate(expense)}
                                disabled={generateExpense.isPending}
                                title="Generate expense"
                              >
                                <Play className="h-4 w-4 text-success" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(expense)}
                            title={expense.is_active ? "Pause" : "Resume"}
                          >
                            {expense.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? "Edit Recurring Expense" : "Add Recurring Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Description *</Label>
                <Input
                  placeholder="Office 365 Subscription"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  placeholder="Microsoft"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="99.99"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: RecurringFrequency) =>
                    setFormData((prev) => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  placeholder="IT"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, department: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Next Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.next_due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.next_due_date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.next_due_date}
                      onSelect={(date) =>
                        date && setFormData((prev) => ({ ...prev, next_due_date: date }))
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch
                  checked={formData.auto_submit}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, auto_submit: checked }))
                  }
                />
                <Label>Auto-submit when generated</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.description ||
                !formData.amount ||
                createExpense.isPending ||
                updateExpense.isPending
              }
            >
              {selectedExpense ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{expenseToDelete?.description}</strong>? This will stop all
              future occurrences.
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
    </div>
  );
}
