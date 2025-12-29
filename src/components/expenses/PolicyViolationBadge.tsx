import { AlertTriangle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePolicyViolations } from "@/hooks/useExpensePolicies";

interface PolicyViolationBadgeProps {
  expenseId: string;
}

export function PolicyViolationBadge({ expenseId }: PolicyViolationBadgeProps) {
  const { data: violations } = usePolicyViolations(expenseId);
  
  const unresolvedViolations = violations?.filter((v) => !v.resolved) || [];
  
  if (unresolvedViolations.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="warning" className="gap-1 cursor-help">
            <AlertTriangle className="h-3 w-3" />
            {unresolvedViolations.length} {unresolvedViolations.length === 1 ? "Flag" : "Flags"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <Ban className="h-3 w-3" />
              Approval Blocked
            </div>
            <p className="text-xs text-muted-foreground">
              Resolve all violations before this expense can be approved:
            </p>
            <ul className="text-xs space-y-1">
              {unresolvedViolations.map((v) => (
                <li key={v.id} className="flex items-start gap-1">
                  <span className="text-warning">•</span>
                  {v.violation_details}
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook to check if an expense has unresolved violations
export function useHasUnresolvedViolations(expenseId: string) {
  const { data: violations, isLoading } = usePolicyViolations(expenseId);
  const unresolvedCount = violations?.filter((v) => !v.resolved).length || 0;
  return { hasUnresolved: unresolvedCount > 0, unresolvedCount, isLoading };
}
