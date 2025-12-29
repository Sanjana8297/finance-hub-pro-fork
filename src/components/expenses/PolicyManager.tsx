import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  AlertTriangle,
  DollarSign,
  Calendar,
  Tag,
} from "lucide-react";
import {
  useExpensePolicies,
  useDeleteExpensePolicy,
  ExpensePolicy,
} from "@/hooks/useExpensePolicies";
import { PolicyDialog } from "./PolicyDialog";

const policyTypeIcons = {
  threshold: DollarSign,
  category_restriction: Tag,
  daily_limit: Calendar,
  monthly_limit: Calendar,
};

const policyTypeLabels = {
  threshold: "Amount Threshold",
  category_restriction: "Category Restriction",
  daily_limit: "Daily Limit",
  monthly_limit: "Monthly Limit",
};

const actionBadgeVariants = {
  flag: "warning" as const,
  require_approval: "default" as const,
  auto_reject: "destructive" as const,
};

const actionLabels = {
  flag: "Flag",
  require_approval: "Require Approval",
  auto_reject: "Auto Reject",
};

export function PolicyManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<ExpensePolicy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<ExpensePolicy | null>(null);

  const { data: policies, isLoading } = useExpensePolicies();
  const deletePolicy = useDeleteExpensePolicy();

  const handleEdit = (policy: ExpensePolicy) => {
    setSelectedPolicy(policy);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPolicy(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (policy: ExpensePolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (policyToDelete) {
      await deletePolicy.mutateAsync(policyToDelete.id);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    }
  };

  const formatPolicyDetails = (policy: ExpensePolicy) => {
    switch (policy.policy_type) {
      case "threshold":
        return `Expenses > $${policy.threshold_amount?.toLocaleString()}`;
      case "category_restriction":
        return `Category: ${policy.expense_categories?.name || "Unknown"}`;
      case "daily_limit":
        return `Daily limit: $${policy.threshold_amount?.toLocaleString()}`;
      case "monthly_limit":
        return `Monthly limit: $${policy.threshold_amount?.toLocaleString()}`;
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Expense Policies</CardTitle>
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
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
              ) : policies?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No policies configured</p>
                    <p className="text-sm text-muted-foreground">
                      Create expense policies to automatically flag or restrict certain expenses
                    </p>
                    <Button className="mt-4" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Policy
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                policies?.map((policy) => {
                  const TypeIcon = policyTypeIcons[policy.policy_type];
                  return (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{policy.name}</p>
                          {policy.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {policy.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{policyTypeLabels[policy.policy_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatPolicyDetails(policy)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionBadgeVariants[policy.action]}>
                          {actionLabels[policy.action]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.is_active ? "success" : "muted"}>
                          {policy.is_active ? "Active" : "Inactive"}
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
                            <DropdownMenuItem onClick={() => handleEdit(policy)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(policy)}
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

      <PolicyDialog
        policy={selectedPolicy}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the policy "{policyToDelete?.name}"? 
              This action cannot be undone.
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
