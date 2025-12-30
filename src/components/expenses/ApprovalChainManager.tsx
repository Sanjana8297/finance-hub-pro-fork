import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, Pencil, Trash2, GitBranch, Users } from "lucide-react";
import { useApprovalChains, useDeleteApprovalChain, ApprovalChainWithLevels } from "@/hooks/useApprovalChains";
import { ApprovalChainDialog } from "./ApprovalChainDialog";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance_manager: "Finance Manager",
  accountant: "Accountant",
  hr: "HR",
  employee: "Employee",
  auditor: "Auditor",
};

export function ApprovalChainManager() {
  const { data: chains, isLoading } = useApprovalChains();
  const deleteChain = useDeleteApprovalChain();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<ApprovalChainWithLevels | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chainToDelete, setChainToDelete] = useState<string | null>(null);

  const handleEdit = (chain: ApprovalChainWithLevels) => {
    setEditingChain(chain);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingChain(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setChainToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (chainToDelete) {
      deleteChain.mutate(chainToDelete);
      setDeleteDialogOpen(false);
      setChainToDelete(null);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Approval Chains
            </CardTitle>
            <CardDescription>Configure multi-level approval workflows for expenses based on amount thresholds</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Chain
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !chains?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No approval chains configured</p>
            <p className="text-sm">Create your first approval chain to enable multi-level expense approvals</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount Range</TableHead>
                <TableHead>Approval Levels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chains.map((chain) => (
                <TableRow key={chain.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{chain.name}</p>
                      {chain.description && (
                        <p className="text-sm text-muted-foreground">{chain.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatAmount(chain.min_amount)} - {chain.max_amount ? formatAmount(chain.max_amount) : "No limit"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {chain.levels.map((level) => (
                        <Badge key={level.id} variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          L{level.level_order}: {roleLabels[level.role] || level.role}
                        </Badge>
                      ))}
                      {chain.levels.length === 0 && (
                        <span className="text-sm text-muted-foreground">No levels</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={chain.is_active ? "default" : "secondary"}>
                      {chain.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(chain)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(chain.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ApprovalChainDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        chain={editingChain}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Approval Chain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this approval chain? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
