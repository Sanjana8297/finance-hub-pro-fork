import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", income: 45000, expenses: 32000 },
  { month: "Feb", income: 52000, expenses: 38000 },
  { month: "Mar", income: 48000, expenses: 35000 },
  { month: "Apr", income: 61000, expenses: 42000 },
  { month: "May", income: 55000, expenses: 39000 },
  { month: "Jun", income: 67000, expenses: 45000 },
  { month: "Jul", income: 72000, expenses: 48000 },
  { month: "Aug", income: 69000, expenses: 46000 },
  { month: "Sep", income: 78000, expenses: 52000 },
  { month: "Oct", income: 82000, expenses: 55000 },
  { month: "Nov", income: 88000, expenses: 58000 },
  { month: "Dec", income: 95000, expenses: 62000 },
];

export function CashFlowChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cash Flow Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Income vs Expenses for 2024</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(241, 44%, 32%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(241, 44%, 32%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fill: 'hsl(220, 10%, 45%)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fill: 'hsl(220, 10%, 45%)' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 15%, 90%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                labelStyle={{ color: 'hsl(241, 44%, 15%)' }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(241, 44%, 32%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(0, 72%, 51%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenses)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
