import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  useDepartmentBudgets,
  useDepartmentBudgetStatus,
  useCreateDepartmentBudget,
  useUpdateDepartmentBudget,
  useDeleteDepartmentBudget,
  DepartmentBudget,
} from "@/hooks/useDepartmentBudgets";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

function useUniqueDepartments() {
  return useQuery({
    queryKey: ["unique-departments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("department")
        .not("department", "is", null);

      const unique = [...new Set(data?.map((d) => d.department).filter(Boolean))];
      return unique as string[];
    },
  });
}

export function DepartmentBudgetManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<DepartmentBudget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<DepartmentBudget | null>(null);

  const [formData, setFormData] = useState({
    department: "",
    monthly_limit: "",
    alert_threshold: "80",
  });

  const { data: budgets, isLoading: budgetsLoading } = useDepartmentBudgets();
  const { data: statuses, isLoading: statusesLoading } = useDepartmentBudgetStatus();
  const { data: departments } = useUniqueDepartments();
  const { data: company } = useCompany();
  const createBudget = useCreateDepartmentBudget();
  const updateBudget = useUpdateDepartmentBudget();
  const deleteBudget = useDeleteDepartmentBudget();

  const isLoading = budgetsLoading || statusesLoading;

  const handleCreate = () => {
    setSelectedBudget(null);
    setFormData({ department: "", monthly_limit: "", alert_threshold: "80" });
    setDialogOpen(true);
  };

  const handleEdit = (budget: DepartmentBudget) => {
    setSelectedBudget(budget);
    setFormData({
      department: budget.department,
      monthly_limit: budget.monthly_limit.toString(),
      alert_threshold: budget.alert_threshold.toString(),
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (budget: DepartmentBudget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (budgetToDelete) {
      await deleteBudget.mutateAsync(budgetToDelete.id);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleSubmit = async () => {
    const data = {
      department: formData.department,
      monthly_limit: parseFloat(formData.monthly_limit),
      alert_threshold: parseInt(formData.alert_threshold),
    };

    if (selectedBudget) {
      await updateBudget.mutateAsync({ id: selectedBudget.id, ...data });
    } else {
      await createBudget.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  // Available departments (not already budgeted)
  const budgetedDepts = new Set(budgets?.map((b) => b.department) || []);
  const availableDepts = departments?.filter((d) => !budgetedDepts.has(d)) || [];

  const formatCurrency = (value: number) => {
    const currency = company?.currency || "INR";
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: "ok" | "warning" | "exceeded") => {
    switch (status) {
      case "exceeded":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Exceeded
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            On Track
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Budgets</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{budgets?.length || 0}</p>
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
              <p className="text-sm text-muted-foreground">On Track</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-success">
                  {statuses?.filter((s) => s.status === "ok").length || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approaching Limit</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-warning">
                  {statuses?.filter((s) => s.status === "warning").length || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Exceeded</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-destructive">
                  {statuses?.filter((s) => s.status === "exceeded").length || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Status Cards */}
      {statuses && statuses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Month Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statuses
                .filter((s) => s.budget)
                .map((status) => (
                  <Card
                    key={status.department}
                    className={`p-4 ${
                      status.status === "exceeded"
                        ? "border-destructive/50 bg-destructive/5"
                        : status.status === "warning"
                        ? "border-warning/50 bg-warning/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{status.department}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(status.currentSpending)} of{" "}
                          {formatCurrency(status.budget?.monthly_limit || 0)}
                        </p>
                      </div>
                      {getStatusBadge(status.status)}
                    </div>
                    <Progress
                      value={Math.min(status.percentUsed, 100)}
                      className={`h-2 ${
                        status.status === "exceeded"
                          ? "[&>div]:bg-destructive"
                          : status.status === "warning"
                          ? "[&>div]:bg-warning"
                          : "[&>div]:bg-success"
                      }`}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{status.percentUsed.toFixed(0)}% used</span>
                      <span>{formatCurrency(status.remaining)} remaining</span>
                    </div>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Department Budgets</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Monthly Limit</TableHead>
                <TableHead>Alert Threshold</TableHead>
                <TableHead>Current Spending</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : budgets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No budgets set</p>
                    <p className="text-sm text-muted-foreground">
                      Add department budgets to track spending limits
                    </p>
                    <Button className="mt-4" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Budget
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                budgets?.map((budget) => {
                  const status = statuses?.find(
                    (s) => s.department === budget.department
                  );
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">
                        {budget.department}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(budget.monthly_limit)}
                      </TableCell>
                      <TableCell>{budget.alert_threshold}%</TableCell>
                      <TableCell>
                        {formatCurrency(status?.currentSpending || 0)}
                      </TableCell>
                      <TableCell>
                        {status ? getStatusBadge(status.status) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(budget)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(budget)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBudget ? "Edit Budget" : "Add Department Budget"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              {selectedBudget ? (
                <Input value={formData.department} disabled />
              ) : (
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, department: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepts.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">
                      + Add custom department
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              {formData.department === "__custom__" && (
                <Input
                  placeholder="Enter department name"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Monthly Limit ($)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={formData.monthly_limit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    monthly_limit: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Alert Threshold (%)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="80"
                value={formData.alert_threshold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    alert_threshold: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                You'll receive alerts when spending reaches this percentage
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.department ||
                !formData.monthly_limit ||
                createBudget.isPending ||
                updateBudget.isPending
              }
            >
              {selectedBudget ? "Update" : "Create"} Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the budget for{" "}
              <strong>{budgetToDelete?.department}</strong>? This action cannot
              be undone.
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
