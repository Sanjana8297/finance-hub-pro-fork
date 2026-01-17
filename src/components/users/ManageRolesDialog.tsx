import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { UserWithRoles, useUpdateUserRoles } from "@/hooks/useUsers";

interface ManageRolesDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableRoles = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "hr", label: "HR" },
  { value: "employee", label: "Employee" },
  { value: "auditor", label: "Auditor" },
];

export function ManageRolesDialog({
  user,
  open,
  onOpenChange,
}: ManageRolesDialogProps) {
  const updateUserRoles = useUpdateUserRoles();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      setSelectedRoles(user.roles || []);
    }
  }, [open, user]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (selectedRoles.length === 0) {
      return;
    }

    await updateUserRoles.mutateAsync({
      userId: user.id,
      roles: selectedRoles,
    });

    onOpenChange(false);
  };

  if (!user) return null;

  const userName = user.full_name || user.email || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            Manage roles for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Roles Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-2">User</p>
            <p className="font-medium">{userName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Roles *</h3>
            <p className="text-xs text-muted-foreground">
              Select one or more roles for this user
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableRoles.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  />
                  <Label
                    htmlFor={`role-${role.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-destructive">
                At least one role must be selected
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateUserRoles.isPending || selectedRoles.length === 0}
          >
            {updateUserRoles.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
