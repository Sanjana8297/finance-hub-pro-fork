import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePolicyViolations, PolicyViolation } from "@/hooks/useExpensePolicies";

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
          <div className="space-y-1">
            <p className="font-medium">Policy Violations:</p>
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
