import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, MoreHorizontal, XCircle, Trash2, UserCheck, Calendar, ArrowRight } from "lucide-react";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { useExpenseDelegations, useCancelDelegation, useDeleteDelegation, ExpenseDelegation } from "@/hooks/useExpenseDelegations";
import { DelegationDialog } from "./DelegationDialog";
import { useAuth } from "@/contexts/AuthContext";

const getStatusInfo = (delegation: ExpenseDelegation) => {
  const today = new Date();
  const startDate = new Date(delegation.start_date);
  const endDate = new Date(delegation.end_date);

  if (delegation.status === "cancelled") {
    return { label: "Cancelled", variant: "muted" as const };
  }
  
  if (isBefore(endDate, today)) {
    return { label: "Expired", variant: "muted" as const };
  }
  
  if (isAfter(startDate, today)) {
    return { label: "Scheduled", variant: "warning" as const };
  }
  
  if (isWithinInterval(today, { start: startDate, end: endDate })) {
    return { label: "Active", variant: "success" as const };
  }

  return { label: delegation.status, variant: "muted" as const };
};

export function DelegationManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<ExpenseDelegation | null>(null);

  const { user } = useAuth();
  const { data: delegations, isLoading } = useExpenseDelegations();
  const cancelDelegation = useCancelDelegation();
  const deleteDelegation = useDeleteDelegation();

  const handleCancel = async (delegation: ExpenseDelegation) => {
    await cancelDelegation.mutateAsync(delegation.id);
  };

  const handleDeleteClick = (delegation: ExpenseDelegation) => {
    setSelectedDelegation(delegation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDelegation) {
      await deleteDelegation.mutateAsync(selectedDelegation.id);
      setDeleteDialogOpen(false);
      setSelectedDelegation(null);
    }
  };

  const myDelegations = delegations?.filter(d => d.delegator_id === user?.id) || [];
  const receivedDelegations = delegations?.filter(d => d.delegate_id === user?.id) || [];

  return (
    <div className="space-y-6">
      {/* My Delegations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Delegations</CardTitle>
            <CardDescription>
              People you've delegated your approval authority to
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Delegation
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : myDelegations.length === 0 ? (
            <div className="py-8 text-center">
              <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No active delegations. Create one when you're going on leave.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myDelegations.map((delegation) => {
                  const status = getStatusInfo(delegation);
                  return (
                    <TableRow key={delegation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {delegation.delegate?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {delegation.delegate?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(delegation.start_date), "MMM d")}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(delegation.end_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {delegation.reason || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {status.label === "Active" || status.label === "Scheduled" ? (
                              <DropdownMenuItem
                                onClick={() => handleCancel(delegation)}
                                className="text-warning"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(delegation)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Received Delegations */}
      {receivedDelegations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delegations Received</CardTitle>
            <CardDescription>
              Approval authority delegated to you by others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedDelegations.map((delegation) => {
                  const status = getStatusInfo(delegation);
                  return (
                    <TableRow key={delegation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {delegation.delegator?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {delegation.delegator?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(delegation.start_date), "MMM d")}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(delegation.end_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {delegation.reason || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <DelegationDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delegation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this delegation? This action cannot be undone.
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
