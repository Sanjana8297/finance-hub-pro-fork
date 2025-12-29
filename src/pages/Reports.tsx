import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";

const reports = [
  {
    id: "1",
    name: "Income Report",
    description: "Detailed breakdown of all income sources",
    icon: TrendingUp,
    color: "bg-success/10 text-success",
    lastGenerated: "Dec 28, 2024",
  },
  {
    id: "2",
    name: "Expense Report",
    description: "Complete expense analysis by category",
    icon: TrendingDown,
    color: "bg-destructive/10 text-destructive",
    lastGenerated: "Dec 28, 2024",
  },
  {
    id: "3",
    name: "Profit & Loss",
    description: "Monthly P&L statement with comparisons",
    icon: DollarSign,
    color: "bg-primary/10 text-primary",
    lastGenerated: "Dec 27, 2024",
  },
  {
    id: "4",
    name: "Payroll Report",
    description: "Employee payroll summary and deductions",
    icon: Users,
    color: "bg-info/10 text-info",
    lastGenerated: "Dec 25, 2024",
  },
  {
    id: "5",
    name: "Tax Report",
    description: "Tax summary for compliance and filing",
    icon: FileText,
    color: "bg-warning/10 text-warning",
    lastGenerated: "Dec 20, 2024",
  },
  {
    id: "6",
    name: "Monthly Summary",
    description: "Complete monthly financial overview",
    icon: Calendar,
    color: "bg-muted text-muted-foreground",
    lastGenerated: "Dec 01, 2024",
  },
];

const Reports = () => {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and export financial reports
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              December 2024
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Custom Report
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} variant="stat" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${report.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <Badge variant="muted">PDF / Excel</Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">{report.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {report.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  Last: {report.lastGenerated}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm">Generate</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Summary - December 2024</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card variant="stat" className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-success">$284,520</p>
            <p className="text-xs text-success">+18.3% vs Nov</p>
          </Card>
          <Card variant="stat" className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">$113,000</p>
            <p className="text-xs text-destructive">+8.2% vs Nov</p>
          </Card>
          <Card variant="stat" className="p-4">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className="text-2xl font-bold">$171,520</p>
            <p className="text-xs text-success">+24.1% vs Nov</p>
          </Card>
          <Card variant="stat" className="p-4">
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className="text-2xl font-bold">60.3%</p>
            <p className="text-xs text-success">+3.2% vs Nov</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
