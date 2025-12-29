import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Bell,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Receipt,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNotifications, useNotificationStats } from "@/hooks/useNotifications";

const categoryConfig: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  invoice: { icon: FileText, label: "Invoice", color: "text-blue-500" },
  expense: { icon: DollarSign, label: "Expense", color: "text-green-500" },
  payment_reminder: { icon: Clock, label: "Payment Reminder", color: "text-orange-500" },
  receipt: { icon: Receipt, label: "Receipt", color: "text-purple-500" },
  system: { icon: Bell, label: "System", color: "text-gray-500" },
};

const statusConfig: Record<string, { variant: "success" | "destructive" | "warning"; icon: typeof CheckCircle }> = {
  sent: { variant: "success", icon: CheckCircle },
  failed: { variant: "destructive", icon: XCircle },
  pending: { variant: "warning", icon: Clock },
};

const Notifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: notifications, isLoading } = useNotifications(100);
  const { data: stats, isLoading: statsLoading } = useNotificationStats();

  const filteredNotifications = notifications?.filter((notification) => {
    const matchesSearch =
      !searchQuery ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || notification.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" || notification.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const uniqueCategories = [...new Set(notifications?.map((n) => n.category) || [])];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
            <p className="text-muted-foreground">
              Track all sent emails, reminders, and system notifications
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sent</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.sent || 0}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold text-destructive">{stats?.failed || 0}</p>
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
              <p className="text-sm text-muted-foreground">Today</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.todayCount || 0}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-warning/10 p-2">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.weekCount || 0}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryConfig[cat]?.label || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredNotifications?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No notifications found</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications will appear here when emails are sent
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications?.map((notification) => {
                  const category = categoryConfig[notification.category] || categoryConfig.system;
                  const status = statusConfig[notification.status] || statusConfig.pending;
                  const CategoryIcon = category.icon;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                          <span className="text-sm font-medium">{category.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">{notification.title}</p>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {notification.message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {notification.recipient_name && (
                            <p className="font-medium">{notification.recipient_name}</p>
                          )}
                          {notification.recipient_email && (
                            <p className="text-sm text-muted-foreground">
                              {notification.recipient_email}
                            </p>
                          )}
                          {!notification.recipient_name && !notification.recipient_email && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                        </Badge>
                        {notification.error_message && (
                          <p className="mt-1 text-xs text-destructive truncate max-w-[150px]">
                            {notification.error_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {format(new Date(notification.created_at), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Notifications;
