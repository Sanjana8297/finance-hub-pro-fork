import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, differenceInHours } from "date-fns";
import { TrendingUp, AlertTriangle, Clock, DollarSign, Target } from "lucide-react";
import { ExpenseForecasting } from "./ExpenseForecasting";

// Hook for spending trends (last 6 months by category)
function useSpendingTrends() {
  return useQuery({
    queryKey: ["expense-spending-trends"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount, expense_date, status")
          .gte("expense_date", format(start, "yyyy-MM-dd"))
          .lte("expense_date", format(end, "yyyy-MM-dd"));
        
        const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const approved = expenses?.filter(e => e.status === "approved")
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const pending = expenses?.filter(e => e.status === "pending")
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        
        months.push({
          month: format(date, "MMM"),
          total,
          approved,
          pending,
        });
      }
      return months;
    },
  });
}

// Hook for policy violation rates
function useViolationRates() {
  return useQuery({
    queryKey: ["expense-violation-rates"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        // Get expenses for this month
        const { data: expenses } = await supabase
          .from("expenses")
          .select("id")
          .gte("expense_date", format(start, "yyyy-MM-dd"))
          .lte("expense_date", format(end, "yyyy-MM-dd"));
        
        const expenseIds = expenses?.map(e => e.id) || [];
        
        // Get violations for these expenses
        const { data: violations } = await supabase
          .from("expense_policy_violations")
          .select("id, resolved, expense_id")
          .in("expense_id", expenseIds.length > 0 ? expenseIds : ["none"]);
        
        const totalExpenses = expenses?.length || 0;
        const totalViolations = violations?.length || 0;
        const resolvedViolations = violations?.filter(v => v.resolved).length || 0;
        const unresolvedViolations = totalViolations - resolvedViolations;
        const violationRate = totalExpenses > 0 ? (totalViolations / totalExpenses) * 100 : 0;
        
        months.push({
          month: format(date, "MMM"),
          totalExpenses,
          violations: totalViolations,
          resolved: resolvedViolations,
          unresolved: unresolvedViolations,
          rate: Math.round(violationRate),
        });
      }
      return months;
    },
  });
}

// Hook for approval times
function useApprovalTimes() {
  return useQuery({
    queryKey: ["expense-approval-times"],
    queryFn: async () => {
      // Get approved expenses with their timestamps
      const { data: expenses } = await supabase
        .from("expenses")
        .select("created_at, approved_at, status")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: false })
        .limit(100);
      
      if (!expenses || expenses.length === 0) {
        return {
          distribution: [
            { name: "< 4 hours", value: 0, color: "hsl(142, 76%, 36%)" },
            { name: "4-24 hours", value: 0, color: "hsl(48, 96%, 53%)" },
            { name: "1-3 days", value: 0, color: "hsl(38, 92%, 50%)" },
            { name: "> 3 days", value: 0, color: "hsl(0, 72%, 51%)" },
          ],
          averageHours: 0,
          fastestHours: 0,
          slowestHours: 0,
        };
      }
      
      let under4h = 0, under24h = 0, under3d = 0, over3d = 0;
      const times: number[] = [];
      
      expenses.forEach(exp => {
        const hours = differenceInHours(new Date(exp.approved_at!), new Date(exp.created_at));
        times.push(hours);
        
        if (hours < 4) under4h++;
        else if (hours < 24) under24h++;
        else if (hours < 72) under3d++;
        else over3d++;
      });
      
      const averageHours = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      
      return {
        distribution: [
          { name: "< 4 hours", value: under4h, color: "hsl(142, 76%, 36%)" },
          { name: "4-24 hours", value: under24h, color: "hsl(48, 96%, 53%)" },
          { name: "1-3 days", value: under3d, color: "hsl(38, 92%, 50%)" },
          { name: "> 3 days", value: over3d, color: "hsl(0, 72%, 51%)" },
        ],
        averageHours: Math.round(averageHours),
        fastestHours: Math.min(...times),
        slowestHours: Math.max(...times),
      };
    },
  });
}

// Hook for summary stats
function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["expense-analytics-summary"],
    queryFn: async () => {
      const thisMonth = new Date();
      const lastMonth = subMonths(thisMonth, 1);
      
      // This month expenses
      const { data: thisMonthExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", format(startOfMonth(thisMonth), "yyyy-MM-dd"))
        .lte("expense_date", format(endOfMonth(thisMonth), "yyyy-MM-dd"));
      
      // Last month expenses
      const { data: lastMonthExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", format(startOfMonth(lastMonth), "yyyy-MM-dd"))
        .lte("expense_date", format(endOfMonth(lastMonth), "yyyy-MM-dd"));
      
      // Unresolved violations
      const { count: unresolvedCount } = await supabase
        .from("expense_policy_violations")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false);
      
      // Pending approvals
      const { count: pendingCount } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      const thisMonthTotal = thisMonthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const lastMonthTotal = lastMonthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const trend = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
      
      return {
        thisMonthTotal,
        lastMonthTotal,
        trend: Math.round(trend),
        unresolvedViolations: unresolvedCount || 0,
        pendingApprovals: pendingCount || 0,
      };
    },
  });
}

export function ExpenseAnalytics() {
  const { data: spendingData, isLoading: spendingLoading } = useSpendingTrends();
  const { data: violationData, isLoading: violationLoading } = useViolationRates();
  const { data: approvalData, isLoading: approvalLoading } = useApprovalTimes();
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="forecast" className="gap-2">
          <Target className="h-4 w-4" />
          Forecasting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              {summaryLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">${summary?.thisMonthTotal.toLocaleString()}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${(summary?.trend || 0) >= 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
              <TrendingUp className={`h-5 w-5 ${(summary?.trend || 0) >= 0 ? 'text-destructive' : 'text-success'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">vs Last Month</p>
              {summaryLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className={`text-2xl font-bold ${(summary?.trend || 0) >= 0 ? 'text-destructive' : 'text-success'}`}>
                  {(summary?.trend || 0) >= 0 ? '+' : ''}{summary?.trend}%
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unresolved Violations</p>
              {summaryLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold text-warning">{summary?.unresolvedViolations}</p>
              )}
            </div>
          </div>
        </Card>
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              {summaryLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">{summary?.pendingApprovals}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trends Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Spending Trends</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Monthly expense breakdown (Last 6 months)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {spendingLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(241, 44%, 32%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(241, 44%, 32%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(48, 96%, 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(48, 96%, 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stroke="hsl(241, 44%, 32%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorApproved)"
                      name="Approved"
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      stroke="hsl(48, 96%, 53%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPending)"
                      name="Pending"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Violation Rates Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Policy Violation Rates</CardTitle>
            <p className="text-sm text-muted-foreground">Violations per month</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {violationLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={violationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="resolved" stackId="a" fill="hsl(142, 76%, 36%)" name="Resolved" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unresolved" stackId="a" fill="hsl(0, 72%, 51%)" name="Unresolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
                <span className="text-sm text-muted-foreground">Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(0, 72%, 51%)' }} />
                <span className="text-sm text-muted-foreground">Unresolved</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Times Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Approval Time Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              {approvalLoading ? '...' : `Average: ${approvalData?.averageHours || 0}h`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {approvalLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={approvalData?.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {approvalData?.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number, name: string) => [`${value} expenses`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </TabsContent>

      <TabsContent value="forecast">
        <ExpenseForecasting />
      </TabsContent>
    </Tabs>
  );
}
