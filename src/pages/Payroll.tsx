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
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";

interface Payslip {
  id: string;
  employee: {
    name: string;
    position: string;
    avatar: string;
  };
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "paid" | "pending" | "processing";
  payDate: string;
}

const payslips: Payslip[] = [
  {
    id: "1",
    employee: { name: "Sarah Johnson", position: "Sales Director", avatar: "sarah" },
    period: "December 2024",
    basicSalary: 10416.67,
    allowances: 1500,
    deductions: 2850,
    netPay: 9066.67,
    status: "paid",
    payDate: "Dec 25, 2024",
  },
  {
    id: "2",
    employee: { name: "Michael Chen", position: "Senior Developer", avatar: "mike" },
    period: "December 2024",
    basicSalary: 12083.33,
    allowances: 2000,
    deductions: 3200,
    netPay: 10883.33,
    status: "paid",
    payDate: "Dec 25, 2024",
  },
  {
    id: "3",
    employee: { name: "Emily Davis", position: "Lead Designer", avatar: "emily" },
    period: "December 2024",
    basicSalary: 9166.67,
    allowances: 1200,
    deductions: 2400,
    netPay: 7966.67,
    status: "processing",
    payDate: "Dec 31, 2024",
  },
  {
    id: "4",
    employee: { name: "Alex Turner", position: "DevOps Engineer", avatar: "alex" },
    period: "December 2024",
    basicSalary: 10833.33,
    allowances: 1800,
    deductions: 3000,
    netPay: 9633.33,
    status: "pending",
    payDate: "Dec 31, 2024",
  },
  {
    id: "5",
    employee: { name: "Lisa Wong", position: "HR Manager", avatar: "lisa" },
    period: "December 2024",
    basicSalary: 7916.67,
    allowances: 1000,
    deductions: 2100,
    netPay: 6816.67,
    status: "paid",
    payDate: "Dec 25, 2024",
  },
];

const statusConfig = {
  paid: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Paid",
  },
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pending",
  },
  processing: {
    variant: "info" as const,
    icon: Clock,
    label: "Processing",
  },
};

const Payroll = () => {
  const totalPayroll = payslips.reduce((sum, p) => sum + p.netPay, 0);
  const paidAmount = payslips
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.netPay, 0);
  const pendingAmount = payslips
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.netPay, 0);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
            <p className="text-muted-foreground">
              Process payroll and manage employee payslips
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              December 2024
            </Button>
            <Button>
              <DollarSign className="mr-2 h-4 w-4" />
              Process Payroll
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Payroll</p>
          <p className="text-2xl font-bold">
            ${totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success">
            ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning">
            ${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Employees</p>
          <p className="text-2xl font-bold">{payslips.length}</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search employees..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              All Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((payslip) => {
                const status = statusConfig[payslip.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payslip.employee.avatar}`}
                          />
                          <AvatarFallback>
                            {payslip.employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payslip.employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {payslip.employee.position}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{payslip.period}</TableCell>
                    <TableCell>
                      ${payslip.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-success">
                      +${payslip.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-destructive">
                      -${payslip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${payslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payslip.payDate}
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
                            View Payslip
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
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

export default Payroll;
