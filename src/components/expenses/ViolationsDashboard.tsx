import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Tag,
  Filter,
  CheckCheck,
  Check,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type ViolationWithDetails = {
  id: string;
  expense_id: string;
  policy_id: string;
  violation_details: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  expenses: {
    id: string;
    description: string;
    amount: number;
    expense_date: string;
    status: string;
    created_by: string | null;
    expense_categories: { name: string } | null;
  } | null;
  expense_policies: {
    id: string;
    name: string;
    policy_type: string;
    action: string;
  } | null;
  submitter_profile: { full_name: string | null } | null;
  resolver_profile: { full_name: string | null } | null;
};

const policyTypeIcons = {
  threshold: DollarSign,
  category_restriction: Tag,
  daily_limit: Calendar,
  monthly_limit: Calendar,
};

const policyTypeLabels: Record<string, string> = {
  threshold: "Threshold",
  category_restriction: "Category",
  daily_limit: "Daily Limit",
  monthly_limit: "Monthly Limit",
};

const actionBadgeVariants = {
  flag: "warning" as const,
  require_approval: "default" as const,
  auto_reject: "destructive" as const,
};

function useAllViolations() {
  return useQuery({
    queryKey: ["all-policy-violations"],
    queryFn: async () => {
      // First get violations with expense and policy details
      const { data: violations, error } = await supabase
        .from("expense_policy_violations")
        .select(`
          *,
          expenses:expense_id(
            id,
            description,
            amount,
            expense_date,
            status,
            created_by,
            expense_categories:category_id(name)
          ),
          expense_policies:policy_id(
            id,
            name,
            policy_type,
            action
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique creator IDs and resolver IDs
      const creatorIds = [...new Set(
        violations
          .map(v => v.expenses?.created_by)
          .filter(Boolean)
      )] as string[];

      const resolverIds = [...new Set(
        violations
          .map(v => v.resolved_by)
          .filter(Boolean)
      )] as string[];

      const allUserIds = [...new Set([...creatorIds, ...resolverIds])];

      // Fetch profiles for all users
      let profilesMap: Record<string, { full_name: string | null }> = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", allUserIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name };
            return acc;
          }, {} as Record<string, { full_name: string | null }>);
        }
      }

      // Merge profiles into violations
      return violations.map(v => ({
        ...v,
        submitter_profile: v.expenses?.created_by ? profilesMap[v.expenses.created_by] || null : null,
        resolver_profile: v.resolved_by ? profilesMap[v.resolved_by] || null : null,
      })) as ViolationWithDetails[];
    },
  });
}

function useBulkResolveViolations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, resolutionNotes }: { ids: string[]; resolutionNotes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("expense_policy_violations")
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
        })
        .in("id", ids);

      if (error) throw error;
      return { count: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["all-policy-violations"] });
      queryClient.invalidateQueries({ queryKey: ["policy-violations"] });
      toast({
        title: "Violations resolved",
        description: `${result.count} violation${result.count === 1 ? "" : "s"} marked as resolved`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resolve violations",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useResolveSingleViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolutionNotes }: { id: string; resolutionNotes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("expense_policy_violations")
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-policy-violations"] });
      queryClient.invalidateQueries({ queryKey: ["policy-violations"] });
      toast({
        title: "Violation resolved",
        description: "The policy violation has been marked as resolved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resolve violation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function ViolationsDashboard() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [policyTypeFilter, setPolicyTypeFilter] = useState<string>("all");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [singleResolveDialogOpen, setSingleResolveDialogOpen] = useState(false);
  const [violationToResolve, setViolationToResolve] = useState<ViolationWithDetails | null>(null);
  const [singleResolutionNotes, setSingleResolutionNotes] = useState("");

  const { data: violations, isLoading } = useAllViolations();
  const bulkResolve = useBulkResolveViolations();
  const singleResolve = useResolveSingleViolation();

  const filteredViolations = violations?.filter((v) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unresolved" && !v.resolved) ||
      (statusFilter === "resolved" && v.resolved);

    const matchesPolicyType =
      policyTypeFilter === "all" ||
      v.expense_policies?.policy_type === policyTypeFilter;

    return matchesStatus && matchesPolicyType;
  });

  const unresolvedCount = violations?.filter((v) => !v.resolved).length || 0;
  const resolvedCount = violations?.filter((v) => v.resolved).length || 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unresolvedIds = filteredViolations
        ?.filter((v) => !v.resolved)
        .map((v) => v.id) || [];
      setSelectedIds(new Set(unresolvedIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkResolve = async () => {
    if (selectedIds.size === 0) return;
    await bulkResolve.mutateAsync({
      ids: Array.from(selectedIds),
      resolutionNotes,
    });
    setSelectedIds(new Set());
    setResolveDialogOpen(false);
    setResolutionNotes("");
  };

  const handleSingleResolve = (violation: ViolationWithDetails) => {
    setViolationToResolve(violation);
    setSingleResolutionNotes("");
    setSingleResolveDialogOpen(true);
  };

  const handleSingleResolveConfirm = async () => {
    if (!violationToResolve) return;
    await singleResolve.mutateAsync({
      id: violationToResolve.id,
      resolutionNotes: singleResolutionNotes,
    });
    setSingleResolveDialogOpen(false);
    setViolationToResolve(null);
    setSingleResolutionNotes("");
  };

  const unresolvedFilteredCount = filteredViolations?.filter((v) => !v.resolved).length || 0;
  const allUnresolvedSelected = unresolvedFilteredCount > 0 && selectedIds.size === unresolvedFilteredCount;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-warning/10 p-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unresolved</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold text-warning">{unresolvedCount}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-success/10 p-2">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold text-success">{resolvedCount}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Violations</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{violations?.length || 0}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Policy Violations
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={() => setResolveDialogOpen(true)}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Resolve {selectedIds.size} Selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Status:</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Policy Type:</Label>
              <Select value={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="threshold">Threshold</SelectItem>
                  <SelectItem value="category_restriction">Category</SelectItem>
                  <SelectItem value="daily_limit">Daily Limit</SelectItem>
                  <SelectItem value="monthly_limit">Monthly Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Violations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allUnresolvedSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={unresolvedFilteredCount === 0}
                    />
                  </TableHead>
                  <TableHead>Expense</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
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
                ) : filteredViolations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <CheckCircle className="mx-auto h-12 w-12 text-success/50" />
                      <p className="mt-4 text-lg font-medium">No violations found</p>
                      <p className="text-sm text-muted-foreground">
                        {statusFilter === "unresolved"
                          ? "All policy violations have been resolved"
                          : "No violations match the current filters"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredViolations?.map((violation) => {
                    const expense = violation.expenses;
                    const policy = violation.expense_policies;
                    const TypeIcon = policyTypeIcons[policy?.policy_type as keyof typeof policyTypeIcons] || AlertTriangle;

                    return (
                      <TableRow key={violation.id} className={violation.resolved ? "opacity-60" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(violation.id)}
                            onCheckedChange={(checked) => handleSelectOne(violation.id, !!checked)}
                            disabled={violation.resolved}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{expense?.description || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {expense?.expense_categories?.name || "Uncategorized"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {violation.submitter_profile?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${Number(expense?.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{policy?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {policyTypeLabels[policy?.policy_type || ""] || policy?.policy_type}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {violation.violation_details}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(violation.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {violation.resolved ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="success" className="gap-1 cursor-help">
                                    <CheckCircle className="h-3 w-3" />
                                    Resolved
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <User className="h-3 w-3" />
                                      <span>By: {violation.resolver_profile?.full_name || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="h-3 w-3" />
                                      <span>{violation.resolved_at ? format(new Date(violation.resolved_at), "MMM d, yyyy 'at' h:mm a") : "Unknown"}</span>
                                    </div>
                                    {violation.resolution_notes && (
                                      <div className="flex items-start gap-2 text-sm border-t pt-2">
                                        <FileText className="h-3 w-3 mt-0.5" />
                                        <span className="text-muted-foreground">{violation.resolution_notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant={actionBadgeVariants[policy?.action as keyof typeof actionBadgeVariants] || "warning"} className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {policy?.action === "require_approval" ? "Needs Approval" : "Flagged"}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {!violation.resolved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSingleResolve(violation)}
                              className="gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Resolve Dialog */}
      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve {selectedIds.size} Violation{selectedIds.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              Mark the selected policy violations as resolved. This indicates that the flagged expenses have been reviewed and are acceptable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="notes">Resolution Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about why these violations are being resolved..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkResolve}
              disabled={bulkResolve.isPending}
            >
              {bulkResolve.isPending ? "Resolving..." : "Resolve Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Resolve Dialog */}
      <Dialog open={singleResolveDialogOpen} onOpenChange={setSingleResolveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
            <DialogDescription>
              Mark this policy violation as reviewed and acceptable.
            </DialogDescription>
          </DialogHeader>

          {violationToResolve && (
            <div className="space-y-4">
              {/* Violation Details */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Expense</p>
                  <p className="font-medium">{violationToResolve.expenses?.description}</p>
                  <p className="text-sm text-muted-foreground">
                    ${Number(violationToResolve.expenses?.amount || 0).toLocaleString()} • 
                    Submitted by {violationToResolve.submitter_profile?.full_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Policy Violated</p>
                  <p className="font-medium">{violationToResolve.expense_policies?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Violation Details</p>
                  <p className="text-sm text-warning">{violationToResolve.violation_details}</p>
                </div>
              </div>

              {/* Resolution Notes */}
              <div className="space-y-2">
                <Label htmlFor="singleNotes">Resolution Notes</Label>
                <Textarea
                  id="singleNotes"
                  placeholder="Explain why this violation is being resolved (e.g., 'Exception approved by CFO', 'One-time business need')..."
                  value={singleResolutionNotes}
                  onChange={(e) => setSingleResolutionNotes(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Notes will be recorded in the audit trail for compliance purposes.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSingleResolveConfirm} 
              disabled={singleResolve.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {singleResolve.isPending ? "Resolving..." : "Resolve Violation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
