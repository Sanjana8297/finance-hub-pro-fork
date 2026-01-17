import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserWithRoles } from "@/hooks/useUsers";
import { format } from "date-fns";
import { Mail, Phone, Building, Calendar, Shield } from "lucide-react";

interface ViewProfileDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance_manager: "Finance Manager",
  accountant: "Accountant",
  hr: "HR",
  employee: "Employee",
  auditor: "Auditor",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-primary text-primary-foreground",
  admin: "bg-primary/80 text-primary-foreground",
  finance_manager: "bg-success/10 text-success border-success/20",
  accountant: "bg-info/10 text-info border-info/20",
  hr: "bg-warning/10 text-warning border-warning/20",
  employee: "bg-muted text-muted-foreground",
  auditor: "bg-secondary text-secondary-foreground",
};

export function ViewProfileDialog({
  user,
  open,
  onOpenChange,
}: ViewProfileDialogProps) {
  if (!user) return null;

  const userName = user.full_name || user.email || "Unknown";
  const avatarSeed = userName.toLowerCase().replace(/\s+/g, "-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>View user details and information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              />
              <AvatarFallback className="text-2xl">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold">{userName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email || "N/A"}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">Roles</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} className={roleColors[role] || "bg-muted"}>
                    {roleLabels[role] || role}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="font-semibold">Account Information</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {user.created_at
                    ? format(new Date(user.created_at), "MMM d, yyyy")
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {user.updated_at
                    ? format(new Date(user.updated_at), "MMM d, yyyy")
                    : "Unknown"}
                </span>
              </div>
              {user.company_id && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Company ID:</span>
                  <span className="font-medium font-mono text-xs">
                    {user.company_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
