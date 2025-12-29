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
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  location: string;
  salary: number;
  status: "active" | "on-leave" | "terminated";
  joinDate: string;
  avatar: string;
}

const employees: Employee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 123-4567",
    department: "Sales",
    position: "Sales Director",
    location: "New York",
    salary: 125000,
    status: "active",
    joinDate: "Jan 15, 2022",
    avatar: "sarah",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    phone: "+1 (555) 234-5678",
    department: "Engineering",
    position: "Senior Developer",
    location: "San Francisco",
    salary: 145000,
    status: "active",
    joinDate: "Mar 20, 2021",
    avatar: "mike",
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    phone: "+1 (555) 345-6789",
    department: "Design",
    position: "Lead Designer",
    location: "Los Angeles",
    salary: 110000,
    status: "on-leave",
    joinDate: "Jun 01, 2023",
    avatar: "emily",
  },
  {
    id: "4",
    name: "Alex Turner",
    email: "alex.turner@company.com",
    phone: "+1 (555) 456-7890",
    department: "Engineering",
    position: "DevOps Engineer",
    location: "Chicago",
    salary: 130000,
    status: "active",
    joinDate: "Sep 10, 2022",
    avatar: "alex",
  },
  {
    id: "5",
    name: "Lisa Wong",
    email: "lisa.wong@company.com",
    phone: "+1 (555) 567-8901",
    department: "HR",
    position: "HR Manager",
    location: "New York",
    salary: 95000,
    status: "active",
    joinDate: "Feb 28, 2020",
    avatar: "lisa",
  },
  {
    id: "6",
    name: "James Wilson",
    email: "james.wilson@company.com",
    phone: "+1 (555) 678-9012",
    department: "Finance",
    position: "Financial Analyst",
    location: "Boston",
    salary: 85000,
    status: "active",
    joinDate: "Nov 15, 2023",
    avatar: "james",
  },
];

const statusConfig = {
  active: {
    variant: "success" as const,
    label: "Active",
  },
  "on-leave": {
    variant: "warning" as const,
    label: "On Leave",
  },
  terminated: {
    variant: "destructive" as const,
    label: "Terminated",
  },
};

const Employees = () => {
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "on-leave").length;
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">
              Manage your team and employee information
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold">{totalEmployees}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-success">{activeCount}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">On Leave</p>
          <p className="text-2xl font-bold text-warning">{onLeaveCount}</p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Monthly Payroll</p>
          <p className="text-2xl font-bold">
            ${(totalPayroll / 12).toLocaleString()}
          </p>
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
              All Departments
            </Button>
            <Button variant="outline" size="sm">
              All Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => {
          const status = statusConfig[employee.status];
          return (
            <Card key={employee.id} variant="stat" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatar}`}
                    />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {employee.position}
                    </p>
                  </div>
                </div>
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
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{employee.location}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/50">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  Since {employee.joinDate}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Employees;
