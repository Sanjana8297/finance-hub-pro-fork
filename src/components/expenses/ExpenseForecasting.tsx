import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  ReferenceLine,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { TrendingUp, TrendingDown, Target, AlertTriangle, Calendar } from "lucide-react";

interface MonthlyData {
  month: string;
  monthIndex: number;
  total: number;
  approved: number;
  categories: Record<string, number>;
  departments: Record<string, number>;
}

interface ForecastResult {
  predictedTotal: number;
  confidenceLow: number;
  confidenceHigh: number;
  trend: number;
  seasonalFactor: number;
  byCategory: Array<{ name: string; predicted: number; trend: number }>;
  byDepartment: Array<{ name: string; predicted: number; trend: number }>;
  historicalData: Array<{ month: string; actual: number; predicted?: number }>;
}

function useExpenseForecast() {
  return useQuery({
    queryKey: ["expense-forecast"],
    queryFn: async (): Promise<ForecastResult> => {
      // Fetch last 12 months of expense data
      const months: MonthlyData[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data: expenses } = await supabase
          .from("expenses")
          .select(`
            amount,
            status,
            department,
            expense_categories (name)
          `)
          .gte("expense_date", format(start, "yyyy-MM-dd"))
          .lte("expense_date", format(end, "yyyy-MM-dd"));
        
        const categories: Record<string, number> = {};
        const departments: Record<string, number> = {};
        let total = 0;
        let approved = 0;
        
        expenses?.forEach(e => {
          const amount = Number(e.amount);
          total += amount;
          if (e.status === "approved") approved += amount;
          
          const catName = e.expense_categories?.name || "Uncategorized";
          categories[catName] = (categories[catName] || 0) + amount;
          
          const deptName = e.department || "No Department";
          departments[deptName] = (departments[deptName] || 0) + amount;
        });
        
        months.push({
          month: format(date, "MMM yyyy"),
          monthIndex: date.getMonth(),
          total,
          approved,
          categories,
          departments,
        });
      }

      // Calculate trend using linear regression
      const n = months.length;
      const xMean = (n - 1) / 2;
      const yMean = months.reduce((sum, m) => sum + m.total, 0) / n;
      
      let numerator = 0;
      let denominator = 0;
      
      months.forEach((m, i) => {
        numerator += (i - xMean) * (m.total - yMean);
        denominator += (i - xMean) ** 2;
      });
      
      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = yMean - slope * xMean;
      
      // Calculate seasonal factors (compare each month to its expected trend value)
      const seasonalFactors: Record<number, number[]> = {};
      months.forEach((m, i) => {
        const expected = intercept + slope * i;
        const factor = expected !== 0 ? m.total / expected : 1;
        if (!seasonalFactors[m.monthIndex]) {
          seasonalFactors[m.monthIndex] = [];
        }
        seasonalFactors[m.monthIndex].push(factor);
      });
      
      // Average seasonal factors
      const avgSeasonalFactors: Record<number, number> = {};
      Object.entries(seasonalFactors).forEach(([monthIdx, factors]) => {
        avgSeasonalFactors[Number(monthIdx)] = factors.reduce((a, b) => a + b, 0) / factors.length;
      });
      
      // Predict next month
      const nextMonthDate = addMonths(new Date(), 1);
      const nextMonthIndex = nextMonthDate.getMonth();
      const trendPrediction = intercept + slope * n;
      const seasonalFactor = avgSeasonalFactors[nextMonthIndex] || 1;
      const predictedTotal = Math.max(0, trendPrediction * seasonalFactor);
      
      // Calculate confidence interval based on historical variance
      const residuals = months.map((m, i) => m.total - (intercept + slope * i));
      const variance = residuals.reduce((sum, r) => sum + r ** 2, 0) / (n - 1);
      const stdDev = Math.sqrt(variance);
      const confidenceLow = Math.max(0, predictedTotal - 1.96 * stdDev);
      const confidenceHigh = predictedTotal + 1.96 * stdDev;
      
      // Calculate trend percentage
      const lastThreeMonthsAvg = months.slice(-3).reduce((sum, m) => sum + m.total, 0) / 3;
      const previousThreeMonthsAvg = months.slice(-6, -3).reduce((sum, m) => sum + m.total, 0) / 3;
      const trend = previousThreeMonthsAvg > 0 
        ? ((lastThreeMonthsAvg - previousThreeMonthsAvg) / previousThreeMonthsAvg) * 100 
        : 0;
      
      // Forecast by category
      const allCategories = new Set<string>();
      months.forEach(m => Object.keys(m.categories).forEach(c => allCategories.add(c)));
      
      const byCategory = Array.from(allCategories).map(catName => {
        const catData = months.map(m => m.categories[catName] || 0);
        const catMean = catData.reduce((a, b) => a + b, 0) / catData.length;
        const recentMean = catData.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const olderMean = catData.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
        const catTrend = olderMean > 0 ? ((recentMean - olderMean) / olderMean) * 100 : 0;
        
        // Simple prediction: recent average adjusted for trend
        const predicted = recentMean * (1 + catTrend / 100 * 0.5);
        
        return { name: catName, predicted: Math.max(0, predicted), trend: catTrend };
      }).sort((a, b) => b.predicted - a.predicted).slice(0, 5);
      
      // Forecast by department
      const allDepartments = new Set<string>();
      months.forEach(m => Object.keys(m.departments).forEach(d => allDepartments.add(d)));
      
      const byDepartment = Array.from(allDepartments).map(deptName => {
        const deptData = months.map(m => m.departments[deptName] || 0);
        const recentMean = deptData.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const olderMean = deptData.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
        const deptTrend = olderMean > 0 ? ((recentMean - olderMean) / olderMean) * 100 : 0;
        
        const predicted = recentMean * (1 + deptTrend / 100 * 0.5);
        
        return { name: deptName, predicted: Math.max(0, predicted), trend: deptTrend };
      }).sort((a, b) => b.predicted - a.predicted).slice(0, 5);
      
      // Historical data with predictions for chart
      const historicalData = months.map((m, i) => ({
        month: m.month,
        actual: m.total,
        predicted: intercept + slope * i,
      }));
      
      // Add next month prediction
      historicalData.push({
        month: format(nextMonthDate, "MMM yyyy"),
        actual: 0,
        predicted: predictedTotal,
      });
      
      return {
        predictedTotal,
        confidenceLow,
        confidenceHigh,
        trend,
        seasonalFactor,
        byCategory,
        byDepartment,
        historicalData,
      };
    },
  });
}

export function ExpenseForecasting() {
  const { data: forecast, isLoading } = useExpenseForecast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const TrendIndicator = ({ trend }: { trend: number }) => {
    const isUp = trend > 0;
    const Icon = isUp ? TrendingUp : TrendingDown;
    return (
      <div className={`flex items-center gap-1 text-sm ${isUp ? 'text-destructive' : 'text-success'}`}>
        <Icon className="h-4 w-4" />
        <span>{isUp ? '+' : ''}{trend.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Prediction Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Month Forecast</p>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatCurrency(forecast?.predictedTotal || 0)}
                </p>
              )}
            </div>
          </div>
        </Card>
        
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence Range</p>
              {isLoading ? (
                <Skeleton className="h-8 w-36" />
              ) : (
                <p className="text-lg font-semibold">
                  {formatCurrency(forecast?.confidenceLow || 0)} - {formatCurrency(forecast?.confidenceHigh || 0)}
                </p>
              )}
            </div>
          </div>
        </Card>
        
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${(forecast?.trend || 0) > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
              {(forecast?.trend || 0) > 0 ? (
                <TrendingUp className="h-5 w-5 text-destructive" />
              ) : (
                <TrendingDown className="h-5 w-5 text-success" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spending Trend</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className={`text-2xl font-bold ${(forecast?.trend || 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                  {(forecast?.trend || 0) > 0 ? '+' : ''}{forecast?.trend.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </Card>
        
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seasonal Factor</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {((forecast?.seasonalFactor || 1) * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Spending Forecast</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historical spending with trend line and next month prediction
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecast?.historicalData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(241, 44%, 32%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(241, 44%, 32%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 11 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "actual" ? "Actual" : "Trend/Forecast"
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(241, 44%, 32%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <ReferenceLine
                    y={forecast?.predictedTotal}
                    stroke="hsl(142, 76%, 36%)"
                    strokeDasharray="5 5"
                    label={{
                      value: `Forecast: ${formatCurrency(forecast?.predictedTotal || 0)}`,
                      position: 'right',
                      fill: 'hsl(142, 76%, 36%)',
                      fontSize: 11,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category and Department Forecasts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Forecast by Category</CardTitle>
            <p className="text-sm text-muted-foreground">
              Predicted spending for top categories
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="space-y-4">
                {forecast?.byCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <TrendIndicator trend={cat.trend} />
                      <span className="font-bold w-24 text-right">
                        {formatCurrency(cat.predicted)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!forecast?.byCategory || forecast.byCategory.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No category data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Department */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Forecast by Department</CardTitle>
            <p className="text-sm text-muted-foreground">
              Predicted spending for top departments
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="space-y-4">
                {forecast?.byDepartment.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-secondary" />
                      <span className="font-medium truncate">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <TrendIndicator trend={dept.trend} />
                      <span className="font-bold w-24 text-right">
                        {formatCurrency(dept.predicted)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!forecast?.byDepartment || forecast.byDepartment.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No department data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Methodology Note */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Badge variant="muted" className="mt-0.5">Info</Badge>
            <p className="text-sm text-muted-foreground">
              Forecasts are calculated using linear regression on the last 12 months of data, 
              adjusted for seasonal patterns. The confidence range represents a 95% prediction interval. 
              Actual spending may vary based on unexpected expenses or changes in business operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
