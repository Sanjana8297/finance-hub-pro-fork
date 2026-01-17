import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCreateUser } from "@/hooks/useUsers";

interface UserDialogProps {
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

export function UserDialog({ open, onOpenChange }: UserDialogProps) {
  const createUser = useCreateUser();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [] as string[],
  });

  useEffect(() => {
    if (open) {
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        roles: ["employee"], // Default role
      });
    }
  }, [open]);

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      if (prev.roles.includes(role)) {
        return {
          ...prev,
          roles: prev.roles.filter((r) => r !== role),
        };
      } else {
        return {
          ...prev,
          roles: [...prev.roles, role],
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (formData.password.length < 6) {
      return;
    }

    if (formData.roles.length === 0) {
      return;
    }

    await createUser.mutateAsync({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      roles: formData.roles,
    });

    onOpenChange(false);
  };

  const isPending = createUser.isPending;
  const isValid =
    formData.fullName &&
    formData.email &&
    formData.password &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 6 &&
    formData.roles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will receive an email confirmation link to activate their account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Password</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimum 6 characters"
                />
                {formData.password && formData.password.length < 6 && (
                  <p className="text-xs text-destructive">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm password"
                />
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Roles *</h3>
            <p className="text-xs text-muted-foreground">
              Select one or more roles for this user
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableRoles.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={formData.roles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  />
                  <Label
                    htmlFor={role.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
            {formData.roles.length === 0 && (
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
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
