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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: company } = useCompany();

  const currency = company?.currency || "INR";

  const formatChange = (value: number, isExpense = false) => {
    const sign = value >= 0 ? "+" : "";
    const label = isExpense ? "from last month" : "from last month";
    return `${sign}${value.toFixed(1)}% ${label}`;
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || "User"}. Here's your financial overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              This Month
            </Button>
            <Button asChild>
              <Link to="/receipts">
                <Plus className="mr-2 h-4 w-4" />
                New Receipt
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </>
        ) : (
          <>
            <div className="animate-slide-up opacity-0 stagger-1">
              <StatCard
                title="Total Receipts"
                value={formatCurrency(stats?.totalReceipts || 0, currency, { compact: true })}
                change={formatChange(stats?.receiptsChange || 0)}
                changeType={stats?.receiptsChange && stats.receiptsChange >= 0 ? "positive" : "negative"}
                icon={Receipt}
                iconColor="bg-primary/10 text-primary"
              />
            </div>
            <div className="animate-slide-up opacity-0 stagger-2">
              <StatCard
                title="Total Expenses"
                value={formatCurrency(stats?.totalExpenses || 0, currency, { compact: true })}
                change={formatChange(stats?.expensesChange || 0, true)}
                changeType={stats?.expensesChange && stats.expensesChange > 0 ? "negative" : "positive"}
                icon={CreditCard}
                iconColor="bg-destructive/10 text-destructive"
              />
            </div>
            <div className="animate-slide-up opacity-0 stagger-3">
              <StatCard
                title="Pending Invoices"
                value={formatCurrency(stats?.pendingInvoices || 0, currency, { compact: true })}
                change={`${stats?.pendingInvoicesCount || 0} invoices pending`}
                changeType="neutral"
                icon={FileText}
                iconColor="bg-warning/10 text-warning"
              />
            </div>
            <div className="animate-slide-up opacity-0 stagger-4">
              <StatCard
                title="Monthly Profit"
                value={formatCurrency(stats?.monthlyProfit || 0, currency, { compact: true })}
                change={formatChange(stats?.profitChange || 0)}
                changeType={(stats?.monthlyProfit || 0) >= 0 ? "positive" : "negative"}
                icon={TrendingUp}
                iconColor={(stats?.monthlyProfit || 0) >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}
              />
            </div>
          </>
        )}
      </div>

      {/* Alerts */}
      {!isLoading && stats?.overdueInvoices && stats.overdueInvoices.count > 0 && (
        <div className="mb-8 animate-slide-up opacity-0 stagger-5">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats.overdueInvoices.count} invoice{stats.overdueInvoices.count > 1 ? 's are' : ' is'} overdue</p>
                <p className="text-sm text-muted-foreground">
                  Total outstanding: {formatCurrency(stats.overdueInvoices.total, currency, { compact: true })}. Send payment reminders to avoid delays.
                </p>
              </div>
              <Button variant="warning" size="sm" asChild>
                <Link to="/invoices">View Overdue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
