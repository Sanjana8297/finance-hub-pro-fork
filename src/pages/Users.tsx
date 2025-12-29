import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roles: string[];
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

const users: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    avatar: "john",
    roles: ["super_admin"],
    status: "active",
    lastLogin: "Dec 29, 2024 10:32",
    createdAt: "Jan 01, 2024",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    avatar: "sarah",
    roles: ["admin", "finance_manager"],
    status: "active",
    lastLogin: "Dec 29, 2024 09:15",
    createdAt: "Feb 15, 2024",
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    avatar: "mike",
    roles: ["accountant"],
    status: "active",
    lastLogin: "Dec 28, 2024 16:45",
    createdAt: "Mar 20, 2024",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    avatar: "emily",
    roles: ["hr"],
    status: "active",
    lastLogin: "Dec 29, 2024 08:00",
    createdAt: "Apr 10, 2024",
  },
  {
    id: "5",
    name: "Alex Turner",
    email: "alex.turner@company.com",
    avatar: "alex",
    roles: ["employee"],
    status: "inactive",
    lastLogin: "Dec 15, 2024 12:30",
    createdAt: "May 05, 2024",
  },
  {
    id: "6",
    name: "Lisa Wong",
    email: "lisa.wong@company.com",
    avatar: "lisa",
    roles: ["auditor"],
    status: "active",
    lastLogin: "Dec 28, 2024 14:20",
    createdAt: "Jun 01, 2024",
  },
];

const roleColors: Record<string, string> = {
  super_admin: "bg-primary text-primary-foreground",
  admin: "bg-primary/80 text-primary-foreground",
  finance_manager: "bg-success/10 text-success border-success/20",
  accountant: "bg-info/10 text-info border-info/20",
  hr: "bg-warning/10 text-warning border-warning/20",
  employee: "bg-muted text-muted-foreground",
  auditor: "bg-secondary text-secondary-foreground",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance_manager: "Finance Manager",
  accountant: "Accountant",
  hr: "HR",
  employee: "Employee",
  auditor: "Auditor",
};

const Users = () => {
  const activeUsers = users.filter((u) => u.status === "active").length;
  const inactiveUsers = users.filter((u) => u.status === "inactive").length;

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and permissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-success">{activeUsers}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-muted-foreground">{inactiveUsers}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.roles.includes("super_admin") || u.roles.includes("admin")).length}
          </p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              All Roles
            </Button>
            <Button variant="outline" size="sm">
              All Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} className={roleColors[role]}>
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.status === "active" ? (
                      <Badge variant="success" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="gap-1">
                        <UserX className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Users;
