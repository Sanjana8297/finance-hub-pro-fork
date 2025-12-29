import { Ban, CheckCircle, MoreHorizontal, Pencil, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApproveExpense, Expense } from "@/hooks/useExpenses";
import { usePolicyViolations } from "@/hooks/useExpensePolicies";

interface ExpenseActionsProps {
  expense: Expense;
  canApprove: boolean;
  onEdit: (expense: Expense) => void;
  onReject: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseActions({
  expense,
  canApprove,
  onEdit,
  onReject,
  onDelete,
}: ExpenseActionsProps) {
  const approveExpense = useApproveExpense();
  const { data: violations } = usePolicyViolations(expense.id);
  
  const unresolvedViolations = violations?.filter((v) => !v.resolved) || [];
  const hasUnresolvedViolations = unresolvedViolations.length > 0;
  const isPending = expense.status === "pending";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={() => onEdit(expense)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {isPending && canApprove && (
          <>
            {hasUnresolvedViolations ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground opacity-50">
                      <Ban className="mr-2 h-4 w-4" />
                      Approve (Blocked)
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium text-destructive">Approval Blocked</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {unresolvedViolations.length} unresolved policy violation{unresolvedViolations.length !== 1 ? "s" : ""} must be resolved first.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <DropdownMenuItem
                className="text-success"
                onClick={() => approveExpense.mutate(expense.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onReject(expense)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(expense)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
