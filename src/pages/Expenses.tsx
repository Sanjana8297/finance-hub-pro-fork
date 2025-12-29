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
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
} from "lucide-react";

interface Expense {
  id: string;
  description: string;
  category: string;
  department: string;
  amount: number;
  submittedBy: {
    name: string;
    avatar: string;
  };
  date: string;
  status: "approved" | "pending" | "rejected";
  hasReceipt: boolean;
}

const expenses: Expense[] = [
  {
    id: "1",
    description: "Client dinner - Acme Corp meeting",
    category: "Meals & Entertainment",
    department: "Sales",
    amount: 325.5,
    submittedBy: { name: "Sarah Johnson", avatar: "sarah" },
    date: "Dec 28, 2024",
    status: "approved",
    hasReceipt: true,
  },
  {
    id: "2",
    description: "Flight to NYC - Annual conference",
    category: "Travel",
    department: "Marketing",
    amount: 856.0,
    submittedBy: { name: "Mike Chen", avatar: "mike" },
    date: "Dec 27, 2024",
    status: "pending",
    hasReceipt: true,
  },
  {
    id: "3",
    description: "Software subscription - Figma",
    category: "Technology",
    department: "Design",
    amount: 45.0,
    submittedBy: { name: "Emily Davis", avatar: "emily" },
    date: "Dec 26, 2024",
    status: "approved",
    hasReceipt: true,
  },
  {
    id: "4",
    description: "Office supplies",
    category: "Office Supplies",
    department: "Operations",
    amount: 234.0,
    submittedBy: { name: "John Smith", avatar: "john" },
    date: "Dec 25, 2024",
    status: "pending",
    hasReceipt: false,
  },
  {
    id: "5",
    description: "Hotel stay - Chicago trip",
    category: "Travel",
    department: "Engineering",
    amount: 425.0,
    submittedBy: { name: "Alex Turner", avatar: "alex" },
    date: "Dec 24, 2024",
    status: "rejected",
    hasReceipt: true,
  },
  {
    id: "6",
    description: "Team building event",
    category: "Team Activities",
    department: "HR",
    amount: 1200.0,
    submittedBy: { name: "Lisa Wong", avatar: "lisa" },
    date: "Dec 23, 2024",
    status: "approved",
    hasReceipt: true,
  },
];

const statusConfig = {
  approved: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Approved",
  },
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pending",
  },
  rejected: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
  },
};

const Expenses = () => {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const approvedAmount = expenses
    .filter((exp) => exp.status === "approved")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingAmount = expenses
    .filter((exp) => exp.status === "pending")
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Track and approve company expenses
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Submit Expense
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold">
            ${totalExpenses.toLocaleString()}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-success">
            ${approvedAmount.toLocaleString()}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending Approval</p>
          <p className="text-2xl font-bold text-warning">
            ${pendingAmount.toLocaleString()}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">48 expenses</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              All Departments
            </Button>
            <Button variant="outline" size="sm">
              All Categories
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const status = statusConfig[expense.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>{expense.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${expense.submittedBy.avatar}`}
                          />
                          <AvatarFallback>
                            {expense.submittedBy.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{expense.submittedBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.date}
                    </TableCell>
                    <TableCell>
                      {expense.hasReceipt ? (
                        <Badge variant="success" className="gap-1">
                          <Receipt className="h-3 w-3" />
                          Attached
                        </Badge>
                      ) : (
                        <Badge variant="muted">Missing</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
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
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {expense.status === "pending" && (
                            <>
                              <DropdownMenuItem className="text-success">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Expenses;
