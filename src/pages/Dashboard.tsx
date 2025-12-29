import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InvoiceList } from "@/components/dashboard/InvoiceList";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { 
  Receipt, 
  FileText, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Clock,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, John. Here's your financial overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Last 30 Days
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up opacity-0 stagger-1">
          <StatCard
            title="Total Receipts"
            value="$284,520"
            change="+12.5% from last month"
            changeType="positive"
            icon={Receipt}
            iconColor="bg-primary/10 text-primary"
          />
        </div>
        <div className="animate-slide-up opacity-0 stagger-2">
          <StatCard
            title="Total Expenses"
            value="$113,000"
            change="+8.2% from last month"
            changeType="negative"
            icon={CreditCard}
            iconColor="bg-destructive/10 text-destructive"
          />
        </div>
        <div className="animate-slide-up opacity-0 stagger-3">
          <StatCard
            title="Pending Invoices"
            value="$45,250"
            change="12 invoices pending"
            changeType="neutral"
            icon={FileText}
            iconColor="bg-warning/10 text-warning"
          />
        </div>
        <div className="animate-slide-up opacity-0 stagger-4">
          <StatCard
            title="Monthly Profit"
            value="$171,520"
            change="+18.3% from last month"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-success/10 text-success"
          />
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-8 animate-slide-up opacity-0 stagger-5">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium">3 invoices are overdue</p>
              <p className="text-sm text-muted-foreground">
                Total outstanding: $36,750. Send payment reminders to avoid delays.
              </p>
            </div>
            <Button variant="warning" size="sm">
              View Overdue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <CashFlowChart />
        <ExpenseBreakdown />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InvoiceList />
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
