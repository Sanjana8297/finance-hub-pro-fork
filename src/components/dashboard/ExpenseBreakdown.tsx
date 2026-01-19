import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useExpenseBreakdown } from "@/hooks/useDashboardStats";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/utils";

export function ExpenseBreakdown() {
  const { data, isLoading } = useExpenseBreakdown();
  const { data: company } = useCompany();
  const currency = company?.currency || "INR";

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const categories = data || [];
  const total = categories.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Expense Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">By category this month</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          {categories.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No expenses this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 15%, 90%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value, currency), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {categories.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categories.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground truncate">{item.name}</span>
                <span className="ml-auto text-sm font-medium">
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
