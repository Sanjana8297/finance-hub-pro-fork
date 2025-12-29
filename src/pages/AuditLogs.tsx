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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  Download,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  Settings,
  Shield,
} from "lucide-react";

interface AuditLog {
  id: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  action: string;
  actionType: "login" | "logout" | "create" | "update" | "delete" | "approve";
  tableName: string;
  recordId: string;
  timestamp: string;
  ipAddress: string;
}

const auditLogs: AuditLog[] = [
  {
    id: "1",
    user: { name: "John Smith", email: "john@company.com", avatar: "john" },
    action: "Created invoice INV-2024-001",
    actionType: "create",
    tableName: "invoices",
    recordId: "inv-001",
    timestamp: "Dec 29, 2024 10:32:15",
    ipAddress: "192.168.1.100",
  },
  {
    id: "2",
    user: { name: "Sarah Johnson", email: "sarah@company.com", avatar: "sarah" },
    action: "Approved expense EXP-2024-045",
    actionType: "approve",
    tableName: "expenses",
    recordId: "exp-045",
    timestamp: "Dec 29, 2024 10:15:42",
    ipAddress: "192.168.1.105",
  },
  {
    id: "3",
    user: { name: "Mike Chen", email: "mike@company.com", avatar: "mike" },
    action: "Logged in",
    actionType: "login",
    tableName: "auth",
    recordId: "-",
    timestamp: "Dec 29, 2024 09:45:00",
    ipAddress: "192.168.1.110",
  },
  {
    id: "4",
    user: { name: "Emily Davis", email: "emily@company.com", avatar: "emily" },
    action: "Updated employee profile",
    actionType: "update",
    tableName: "employees",
    recordId: "emp-012",
    timestamp: "Dec 29, 2024 09:30:22",
    ipAddress: "192.168.1.115",
  },
  {
    id: "5",
    user: { name: "John Smith", email: "john@company.com", avatar: "john" },
    action: "Deleted receipt RCP-2024-089",
    actionType: "delete",
    tableName: "receipts",
    recordId: "rcp-089",
    timestamp: "Dec 28, 2024 16:45:10",
    ipAddress: "192.168.1.100",
  },
  {
    id: "6",
    user: { name: "Lisa Wong", email: "lisa@company.com", avatar: "lisa" },
    action: "Logged out",
    actionType: "logout",
    tableName: "auth",
    recordId: "-",
    timestamp: "Dec 28, 2024 18:00:00",
    ipAddress: "192.168.1.120",
  },
];

const actionConfig = {
  login: { icon: LogIn, color: "bg-success/10 text-success", label: "Login" },
  logout: { icon: LogOut, color: "bg-muted text-muted-foreground", label: "Logout" },
  create: { icon: Plus, color: "bg-info/10 text-info", label: "Create" },
  update: { icon: Edit, color: "bg-warning/10 text-warning", label: "Update" },
  delete: { icon: Trash2, color: "bg-destructive/10 text-destructive", label: "Delete" },
  approve: { icon: Shield, color: "bg-primary/10 text-primary", label: "Approve" },
};

const AuditLogs = () => {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Actions</p>
          <p className="text-2xl font-bold">12,458</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Today</p>
          <p className="text-2xl font-bold">156</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="text-2xl font-bold">24</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Failed Logins</p>
          <p className="text-2xl font-bold text-destructive">3</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search logs..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              All Actions
            </Button>
            <Button variant="outline" size="sm">
              All Users
            </Button>
            <Button variant="outline" size="sm">
              Last 7 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => {
                const config = actionConfig[log.actionType];
                const Icon = config.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user.avatar}`}
                          />
                          <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{log.user.name}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm">{log.action}</p>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{log.tableName}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.recordId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AuditLogs;
